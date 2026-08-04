import type { FormatoEbook, Pedido, Produto } from '../types';
import { quantidadeMaxima } from './carrinho';

/**
 * Regras da área do cliente. Puro: agrega pedidos, monta as cotas de
 * download e decide o que dá para recomprar. Sem React, sem relógio próprio.
 */

/* ------------------------------------------------------------------ */
/* 1. Abas                                                             */
/* ------------------------------------------------------------------ */

export type AbaDaConta = 'pedidos' | 'downloads' | 'dados';

export const ABAS: { valor: AbaDaConta; rotulo: string }[] = [
  { valor: 'pedidos', rotulo: 'Pedidos' },
  { valor: 'downloads', rotulo: 'Downloads' },
  { valor: 'dados', rotulo: 'Meus dados' },
];

/**
 * Aba pedida na URL, com o padrão para qualquer coisa fora do domínio.
 *
 * Testes de mesa:
 *   lerAba('downloads') → 'downloads'
 *   lerAba('dados')     → 'dados'
 *   lerAba('xpto')      → 'pedidos'
 *   lerAba(null)        → 'pedidos'
 *   lerAba('')          → 'pedidos'
 */
export function lerAba(valor: string | null): AbaDaConta {
  const encontrada = ABAS.find((aba) => aba.valor === valor);

  return encontrada?.valor ?? 'pedidos';
}

/* ------------------------------------------------------------------ */
/* 2. Cobrança em aberto                                               */
/* ------------------------------------------------------------------ */

/**
 * Tempo até a cobrança vencer, curto o bastante para caber numa linha de
 * lista. String vazia quando já venceu — quem rotula "expirada" é a tela.
 *
 * `agora` por parâmetro, como no resto do projeto.
 *
 * Testes de mesa (expiraEm = '2026-08-04T12:30:00Z'):
 *   agora 12:00:00 → '30 min'
 *   agora 12:29:10 → '1 min'    (arredonda para cima: ainda dá tempo)
 *   agora 11:00:00 → '2 h'
 *   agora 12:30:00 → ''         (venceu)
 *   agora 13:00:00 → ''
 *   data inválida  → ''
 */
export function tempoRestante(expiraEm: string, agora: string): string {
  const restante = new Date(expiraEm).getTime() - new Date(agora).getTime();
  if (!Number.isFinite(restante) || restante <= 0) return '';

  const minutos = Math.ceil(restante / 60000);
  if (minutos < 60) return `${minutos} min`;

  return `${Math.ceil(minutos / 60)} h`;
}

/* ------------------------------------------------------------------ */
/* 3. Downloads                                                        */
/* ------------------------------------------------------------------ */

/** Uma cota é uma compra: dois pedidos do mesmo e-book dão duas cotas. */
export interface CotaDeDownload {
  pedidoId: string;
  numeroDoPedido: string;
  produtoId: string;
  formato: FormatoEbook;
  url: string;
  downloadsRestantes: number;
}

export interface GrupoDeDownloads {
  produtoId: string;
  titulo: string;
  cotas: CotaDeDownload[];
}

/** Só pedido pago ou entregue libera arquivo. */
const STATUS_QUE_LIBERAM = ['pago', 'entregue'];

/**
 * Reúne os downloads dos pedidos do cliente, agrupados por título.
 *
 * Cada cota é mantida separada de propósito: comprar o mesmo e-book duas
 * vezes dá duas cotas de 5, e somar ou deduplicar apagaria o que a pessoa
 * pagou. O agrupamento é só de apresentação.
 *
 * Pedido cancelado, aguardando pagamento ou em separação não entra, mesmo
 * que tenha `downloads` gravado.
 *
 * Testes de mesa:
 *   ped-001 (entregue, e-book pdf+epub) → 1 grupo, 2 cotas
 *   pedido cancelado com downloads      → nenhum grupo
 *   pedido aguardando pagamento         → nenhum grupo
 *   dois pedidos do mesmo e-book        → 1 grupo, cotas somadas em número, não em valor
 *   cliente sem e-book                  → []
 */
export function downloadsDoCliente(pedidos: Pedido[], clienteId: string): GrupoDeDownloads[] {
  const grupos = new Map<string, GrupoDeDownloads>();

  for (const pedido of pedidos) {
    if (pedido.clienteId !== clienteId) continue;
    if (!STATUS_QUE_LIBERAM.includes(pedido.status)) continue;

    for (const download of pedido.downloads ?? []) {
      const item = pedido.itens.find((linha) => linha.produtoId === download.produtoId);
      const titulo = item?.titulo ?? download.produtoId;

      const grupo = grupos.get(download.produtoId) ?? {
        produtoId: download.produtoId,
        titulo,
        cotas: [],
      };

      grupo.cotas.push({
        pedidoId: pedido.id,
        numeroDoPedido: pedido.numero,
        produtoId: download.produtoId,
        formato: download.formato,
        url: download.url,
        downloadsRestantes: download.downloadsRestantes,
      });

      grupos.set(download.produtoId, grupo);
    }
  }

  return [...grupos.values()];
}

/**
 * Desconta um download da cota. Piso em zero: cota esgotada não vira
 * negativa, e o link é desabilitado pela tela antes disso.
 *
 * Testes de mesa:
 *   cota com 5 → 4
 *   cota com 1 → 0
 *   cota com 0 → 0
 *   outro formato do mesmo produto fica intacto
 *   pedido sem downloads → devolvido sem mudança
 *   pedido original nunca é mutado
 */
export function descontarDownload(
  pedido: Pedido,
  produtoId: string,
  formato: FormatoEbook,
): Pedido {
  if (pedido.downloads === undefined) return pedido;

  return {
    ...pedido,
    downloads: pedido.downloads.map((download) =>
      download.produtoId === produtoId && download.formato === formato
        ? { ...download, downloadsRestantes: Math.max(0, download.downloadsRestantes - 1) }
        : download,
    ),
  };
}

/* ------------------------------------------------------------------ */
/* 4. Comprar de novo                                                  */
/* ------------------------------------------------------------------ */

export interface PlanoDeRecompra {
  adicionaveis: { produto: Produto; quantidade: number }[];
  /** Texto pronto para exibir. Vazio quando tudo coube. */
  aviso: string;
  /** Nada pôde ser adicionado: a tela não deve navegar para o carrinho. */
  vazio: boolean;
}

/**
 * O que do pedido ainda dá para comprar hoje.
 *
 * Item cujo produto saiu do catálogo ou está esgotado é omitido, e a
 * omissão é dita — sumir em silêncio faria a pessoa achar que o carrinho
 * está completo. A quantidade é limitada pelo estoque de agora.
 *
 * Testes de mesa:
 *   pedido com tudo disponível        → todos adicionáveis, aviso vazio
 *   pedido com prod-008 (esgotado)    → omitido, aviso citando o título
 *   pedido com produto inexistente    → omitido, aviso genérico
 *   pedido com 9 de prod-006 (est. 3) → quantidade 3, aviso sobre o ajuste
 *   pedido só de itens indisponíveis  → vazio true
 */
export function planejarRecompra(pedido: Pedido, produtos: Produto[]): PlanoDeRecompra {
  const adicionaveis: { produto: Produto; quantidade: number }[] = [];
  const omitidos: string[] = [];
  const ajustados: string[] = [];

  for (const item of pedido.itens) {
    const produto = produtos.find((candidato) => candidato.id === item.produtoId);

    if (produto === undefined) {
      omitidos.push(item.titulo);
      continue;
    }

    const maximo = quantidadeMaxima(produto);
    if (maximo < 1) {
      omitidos.push(produto.titulo);
      continue;
    }

    const quantidade = Math.min(item.quantidade, maximo);
    if (quantidade < item.quantidade) ajustados.push(produto.titulo);

    adicionaveis.push({ produto, quantidade });
  }

  const partes: string[] = [];
  if (omitidos.length > 0) {
    partes.push(
      omitidos.length === 1
        ? `${omitidos[0]} não está disponível e ficou de fora.`
        : `${omitidos.length} títulos não estão disponíveis e ficaram de fora: ${omitidos.join(', ')}.`,
    );
  }
  if (ajustados.length > 0) {
    partes.push(
      `A quantidade de ${ajustados.join(', ')} foi reduzida ao estoque disponível.`,
    );
  }

  return {
    adicionaveis,
    aviso: partes.join(' '),
    vazio: adicionaveis.length === 0,
  };
}

/** Nada disponível: mensagem própria, porque não há carrinho para onde ir. */
export const AVISO_DE_RECOMPRA_IMPOSSIVEL =
  'Nenhum item deste pedido está disponível hoje. O carrinho não foi alterado.';
