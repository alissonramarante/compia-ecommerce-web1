import type { ItemCarrinho, Produto } from '../types';
import { precoVigente } from './catalogo';
import { quantidadeMaxima } from './carrinho';
import { formatarMoeda } from './formatadores';

/**
 * Serialização e reconciliação do carrinho.
 *
 * Premissa que vale para o arquivo inteiro: **o conteúdo lido não é
 * confiável**. `localStorage` é editável pelo usuário e pode ter sobrado de
 * uma versão anterior do código. Tudo que vem de lá passa por validação de
 * forma, e o que não bate é descartado em silêncio — carrinho vazio é uma
 * falha aceitável, exceção na inicialização não é.
 */

/** Versionada: mudar o formato de `ItemCarrinho` significa subir para v2. */
export const CHAVE_CARRINHO = 'compia:carrinho:v1';

/* ------------------------------------------------------------------ */
/* 1. Serialização                                                     */
/* ------------------------------------------------------------------ */

export function serializar(itens: ItemCarrinho[]): string {
  return JSON.stringify(itens);
}

/** Uma entrada só passa se tiver as três chaves com os tipos certos. */
function ehItemValido(valor: unknown): valor is ItemCarrinho {
  if (typeof valor !== 'object' || valor === null) return false;

  const candidato = valor as Record<string, unknown>;

  return (
    typeof candidato.produtoId === 'string' &&
    candidato.produtoId !== '' &&
    typeof candidato.quantidade === 'number' &&
    Number.isInteger(candidato.quantidade) &&
    candidato.quantidade > 0 &&
    typeof candidato.precoUnitario === 'number' &&
    Number.isInteger(candidato.precoUnitario) &&
    candidato.precoUnitario >= 0
  );
}

/**
 * JSON corrompido, tipo errado ou entrada malformada não derrubam nada:
 * o que sobra é o que é válido.
 *
 * Testes de mesa:
 *   desserializar('[]')                                    → []
 *   desserializar('{{{')                                   → []      (não lança)
 *   desserializar('')                                      → []
 *   desserializar('null')                                  → []
 *   desserializar('{"produtoId":"prod-001"}')              → []      (não é array)
 *   desserializar('[{"produtoId":"prod-001","quantidade":2,"precoUnitario":15900}]')
 *                                                          → 1 item
 *   entrada com quantidade 0                               → descartada
 *   entrada com quantidade '2' (string)                    → descartada
 *   entrada sem precoUnitario                              → descartada
 *   entrada com precoUnitario negativo                     → descartada
 *   array misto (1 válida + 2 lixo)                        → só a válida
 *   campos extras na entrada                               → item aceito
 */
export function desserializar(bruto: string): ItemCarrinho[] {
  let analisado: unknown;

  try {
    analisado = JSON.parse(bruto);
  } catch {
    return [];
  }

  if (!Array.isArray(analisado)) return [];

  return analisado.filter(ehItemValido).map((item) => ({
    produtoId: item.produtoId,
    quantidade: item.quantidade,
    precoUnitario: item.precoUnitario,
  }));
}

/* ------------------------------------------------------------------ */
/* 2. Acesso ao armazenamento                                          */
/* ------------------------------------------------------------------ */

/**
 * No modo privado do Safari `localStorage` existe e lança ao escrever; em
 * SSR ele nem existe. Nenhum dos dois pode quebrar o carrinho da sessão,
 * que continua vivo em memória.
 */
export function carregar(): ItemCarrinho[] {
  try {
    if (typeof localStorage === 'undefined') return [];

    const bruto = localStorage.getItem(CHAVE_CARRINHO);
    if (bruto === null) return [];

    return desserializar(bruto);
  } catch {
    return [];
  }
}

export function salvar(itens: ItemCarrinho[]): void {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(CHAVE_CARRINHO, serializar(itens));
  } catch {
    /* Sem espaço ou sem permissão: a sessão segue, só não persiste. */
  }
}

/* ------------------------------------------------------------------ */
/* 3. Reconciliação                                                    */
/* ------------------------------------------------------------------ */

export interface ResultadoDaReconciliacao {
  itens: ItemCarrinho[];
  /** Texto pronto para exibir. Montado aqui, nunca no JSX. */
  avisos: string[];
}

/**
 * Ajusta um carrinho salvo ao catálogo de agora.
 *
 * Estágios por linha, na ordem:
 *   1. Produto não existe mais  → remove.
 *   2. Estoque zerou            → remove.
 *   3. Quantidade acima do teto → reduz.
 *   4. Preço mudou              → adota o vigente, dizendo de quanto para
 *      quanto. Congelar o preço protege a sessão, não uma aba aberta há dias.
 *
 * Vira relevante na Fatia 7, quando o admin editar preço e estoque com um
 * carrinho aberto.
 *
 * Testes de mesa:
 *   carrinho coerente             → itens iguais, 0 avisos
 *   produtoId fantasma            → linha removida, 1 aviso
 *   prod-008 (estoque 0)          → linha removida, 1 aviso
 *   prod-006 x9 (estoque 3)       → quantidade 3, 1 aviso
 *   prod-001 salvo a 18900        → precoUnitario 15900, 1 aviso
 *   e-book x4                     → quantidade 1, 1 aviso
 *   quantidade e preço errados    → 2 avisos para a mesma linha
 */
export function reconciliar(
  itens: ItemCarrinho[],
  produtos: Produto[],
): ResultadoDaReconciliacao {
  const avisos: string[] = [];
  const reconciliados: ItemCarrinho[] = [];

  for (const item of itens) {
    const produto = produtos.find((candidato) => candidato.id === item.produtoId);

    // 1. Saiu do catálogo.
    if (produto === undefined) {
      avisos.push('Um título que estava no carrinho saiu do catálogo e foi removido.');
      continue;
    }

    // 2. Esgotou.
    if (produto.estoque === 0) {
      avisos.push(`${produto.titulo} está esgotado e saiu do carrinho.`);
      continue;
    }

    let { quantidade, precoUnitario } = item;

    // 3. Quantidade acima do possível.
    const maximo = quantidadeMaxima(produto);
    if (quantidade > maximo) {
      avisos.push(
        produto.tipo === 'ebook'
          ? `${produto.titulo} é e-book e vale por uma unidade: quantidade ajustada para 1.`
          : `${produto.titulo} teve a quantidade reduzida de ${quantidade} para ${maximo}, o estoque disponível.`,
      );
      quantidade = maximo;
    }

    // 4. Preço mudou desde a adição.
    const vigente = precoVigente(produto);
    if (precoUnitario !== vigente) {
      avisos.push(
        `${produto.titulo} mudou de ${formatarMoeda(precoUnitario)} para ${formatarMoeda(vigente)}.`,
      );
      precoUnitario = vigente;
    }

    reconciliados.push({ produtoId: item.produtoId, quantidade, precoUnitario });
  }

  return { itens: reconciliados, avisos };
}

/** Carga inicial: lê, valida e reconcilia numa passada. */
export function carregarReconciliado(produtos: Produto[]): ResultadoDaReconciliacao {
  return reconciliar(carregar(), produtos);
}
