import type {
  Cliente,
  DownloadEbook,
  Entrega,
  ItemCarrinho,
  ItemPedido,
  Pagamento,
  Pedido,
  Produto,
  StatusPedido,
} from '../types';
import { calcularSubtotal } from './carrinho';
import { normalizarTexto } from './catalogo';
import { gerarCobrancaPix } from './pagamento';

/**
 * Montagem e transição de pedidos. Puro: nenhuma função lê o relógio — a
 * hora chega por parâmetro, para o teste ser determinístico.
 */

/** Downloads liberados por formato de e-book. */
export const DOWNLOADS_POR_FORMATO = 5;

const PREFIXO_DO_NUMERO = 'CPA';

/* ------------------------------------------------------------------ */
/* 1. Numeração                                                        */
/* ------------------------------------------------------------------ */

/**
 * Sequencial a partir do maior número já usado **naquele ano**. Ano sem
 * pedido nenhum começa em 0001.
 *
 * Testes de mesa (mocks vão de CPA-2026-0139 a CPA-2026-0142):
 *   gerarNumeroPedido(pedidos, 2026) → 'CPA-2026-0143'
 *   gerarNumeroPedido(pedidos, 2027) → 'CPA-2027-0001'
 *   gerarNumeroPedido([], 2026)      → 'CPA-2026-0001'
 *   número malformado é ignorado     → não atrapalha a sequência
 */
export function gerarNumeroPedido(pedidos: Pedido[], ano: number): string {
  const prefixo = `${PREFIXO_DO_NUMERO}-${ano}-`;

  const maior = pedidos.reduce((maximo, pedido) => {
    if (!pedido.numero.startsWith(prefixo)) return maximo;

    const sequencia = Number(pedido.numero.slice(prefixo.length));
    if (!Number.isInteger(sequencia)) return maximo;

    return Math.max(maximo, sequencia);
  }, 0);

  return `${prefixo}${String(maior + 1).padStart(4, '0')}`;
}

/* ------------------------------------------------------------------ */
/* 2. Downloads                                                        */
/* ------------------------------------------------------------------ */

/**
 * Uma entrada por formato de cada e-book. Item físico e kit não geram nada.
 * E-book sem formato declarado também não — melhor nenhum link que um link
 * para extensão inventada.
 *
 * Testes de mesa:
 *   [prod-005] (pdf, epub, mobi) → 3 entradas, downloadsRestantes 5
 *   [prod-007] (só pdf)          → 1 entrada
 *   [prod-001] (físico)          → []
 *   [prod-009] (kit)             → []
 *   [prod-005, prod-001]         → 3 entradas, só do e-book
 *   url                          → '/downloads/{slug}.{formato}'
 */
export function montarDownloads(
  itens: { produtoId: string }[],
  produtos: Produto[],
): DownloadEbook[] {
  const downloads: DownloadEbook[] = [];

  for (const item of itens) {
    const produto = produtos.find((candidato) => candidato.id === item.produtoId);
    if (produto === undefined || produto.tipo !== 'ebook') continue;

    for (const formato of produto.formatos ?? []) {
      downloads.push({
        produtoId: produto.id,
        formato,
        url: `/downloads/${produto.slug}.${formato}`,
        downloadsRestantes: DOWNLOADS_POR_FORMATO,
      });
    }
  }

  return downloads;
}

/* ------------------------------------------------------------------ */
/* 3. Criação                                                          */
/* ------------------------------------------------------------------ */

interface DadosDoPedido {
  cliente: Cliente;
  itens: ItemCarrinho[];
  produtos: Produto[];
  entrega: Entrega;
  pagamento: Pagamento;
  numero: string;
  /** ISO. Vira `criadoEm`, `atualizadoEm` e o primeiro evento. */
  agora: string;
}

/**
 * Monta o pedido a partir do carrinho.
 *
 * Título e tipo entram **congelados**: renomear o produto depois não pode
 * reescrever o histórico de quem já comprou. O preço já vinha congelado do
 * carrinho.
 *
 * `pagamento.valor` é sobrescrito com o total. O pedido tem uma única
 * verdade sobre quanto custa, e não pode divergir do que foi cobrado.
 *
 * O pedido nasce sempre em `aguardando_pagamento`, mesmo com cartão já
 * aprovado: quem faz a transição é `aplicarPagamento`, e assim o histórico
 * registra os dois momentos.
 *
 * Testes de mesa:
 *   itens do carrinho viram ItemPedido com título e tipo dos mocks
 *   subtotal  → soma das linhas
 *   total     → subtotal + entrega.valor
 *   status    → 'aguardando_pagamento'
 *   histórico → 1 evento, em = agora
 *   id        → 'ped-CPA-2026-0143'
 *   item sem produto correspondente é descartado
 */
export function criarPedido({
  cliente,
  itens,
  produtos,
  entrega,
  pagamento,
  numero,
  agora,
}: DadosDoPedido): Pedido {
  const itensDoPedido: ItemPedido[] = [];

  for (const item of itens) {
    const produto = produtos.find((candidato) => candidato.id === item.produtoId);
    if (produto === undefined) continue;

    itensDoPedido.push({
      produtoId: item.produtoId,
      titulo: produto.titulo,
      tipo: produto.tipo,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
    });
  }

  const subtotal = calcularSubtotal(itens);
  const total = subtotal + entrega.valor;

  return {
    id: `ped-${numero}`,
    numero,
    clienteId: cliente.id,
    itens: itensDoPedido,
    subtotal,
    entrega,
    total,
    pagamento: { ...pagamento, valor: total },
    status: 'aguardando_pagamento',
    historico: [{ status: 'aguardando_pagamento', em: agora }],
    criadoEm: agora,
    atualizadoEm: agora,
  };
}

/* ------------------------------------------------------------------ */
/* 4. Transição de status                                              */
/* ------------------------------------------------------------------ */

/** Pedido em que tudo é e-book não tem o que despachar nem retirar. */
function somenteEbooks(pedido: Pedido): boolean {
  return pedido.itens.length > 0 && pedido.itens.every((item) => item.tipo === 'ebook');
}

const OBSERVACAO: Record<string, string> = {
  pago: 'Pagamento aprovado.',
  pronto_para_retirada: 'Pagamento aprovado. Disponível para retirada na sede.',
  entregue: 'Pagamento aprovado. Download liberado.',
  cancelado: 'Pagamento recusado. Nenhuma cobrança foi feita.',
};

/**
 * Aplica o resultado do pagamento e registra o evento correspondente.
 *
 * Ordem de decisão para pagamento aprovado:
 *   1. Só e-book        → `entregue`, e o pedido ganha `downloads`. Não há
 *      o que separar nem retirar; o download é a entrega.
 *   2. Retirada no local → `pronto_para_retirada`.
 *   3. Qualquer outro    → `pago`, e a separação segue no admin.
 *
 * Recusado vai para `cancelado`. Status que não seja aprovado nem recusado
 * (PIX ainda pendente) atualiza o pagamento sem mexer no status: a cobrança
 * existe, o pedido continua esperando.
 *
 * `produtos` é obrigatório: sem ele um pedido de e-book seria aprovado e
 * ficaria sem os arquivos, falhando em silêncio.
 *
 * Testes de mesa:
 *   aprovado + item físico     → 'pago', histórico +1
 *   aprovado + retirada        → 'pronto_para_retirada'
 *   aprovado + só e-book       → 'entregue' e downloads preenchidos
 *   recusado                   → 'cancelado', sem downloads
 *   pendente                   → status inalterado, sem evento novo
 *   aprovado                   → pagamento.pagoEm = agora
 *   sempre                     → atualizadoEm = agora, pedido original intacto
 */
export function aplicarPagamento(
  pedido: Pedido,
  pagamento: Pagamento,
  agora: string,
  produtos: Produto[],
): Pedido {
  const aprovado = pagamento.status === 'aprovado';
  const recusado = pagamento.status === 'recusado';

  // Nem aprovado nem recusado: só a cobrança muda.
  if (!aprovado && !recusado) {
    return { ...pedido, pagamento, atualizadoEm: agora };
  }

  let status: StatusPedido;
  if (recusado) status = 'cancelado';
  else if (somenteEbooks(pedido)) status = 'entregue';
  else if (pedido.entrega.modalidade === 'retirada') status = 'pronto_para_retirada';
  else status = 'pago';

  const atualizado: Pedido = {
    ...pedido,
    pagamento: aprovado ? { ...pagamento, pagoEm: agora } : pagamento,
    status,
    historico: [
      ...pedido.historico,
      { status, em: agora, observacao: OBSERVACAO[status] },
    ],
    atualizadoEm: agora,
  };

  if (status === 'entregue') {
    atualizado.downloads = montarDownloads(pedido.itens, produtos);
  }

  return atualizado;
}

/* ------------------------------------------------------------------ */
/* 5. Renovação da cobrança PIX                                        */
/* ------------------------------------------------------------------ */

/** Como o status do pedido aparece para o cliente. */
export const ROTULO_DE_STATUS: Record<StatusPedido, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  pronto_para_retirada: 'Pronto para retirada',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

/**
 * Substitui uma cobrança PIX vencida por uma nova, pelo mesmo total, e
 * registra o evento. O status do pedido não muda: ele continuava e continua
 * aguardando pagamento — só o meio de pagar foi renovado.
 *
 * Não confere se venceu de fato: quem decide é `cobrancaExpirada`, e é a
 * tela que oferece o botão. Chamar sem necessidade só gera outra cobrança.
 *
 * Testes de mesa (ped-003, total 32736, agora = '2026-08-04T12:00:00Z'):
 *   pagamento.payloadPix   → diferente do anterior
 *   pagamento.expiraEm     → '2026-08-04T12:30:00.000Z'
 *   pagamento.status       → 'pendente'
 *   pagamento.valor        → 32736, o total do pedido
 *   status do pedido       → segue 'aguardando_pagamento'
 *   histórico              → ganha um evento com a observação da renovação
 *   pedido original        → intacto
 */
export function renovarCobrancaPix(pedido: Pedido, agora: string): Pedido {
  return {
    ...pedido,
    pagamento: gerarCobrancaPix(pedido.total, agora),
    historico: [
      ...pedido.historico,
      {
        status: pedido.status,
        em: agora,
        observacao: 'Cobrança PIX expirada. Nova cobrança gerada.',
      },
    ],
    atualizadoEm: agora,
  };
}

/* ------------------------------------------------------------------ */
/* 6. Admin: filtro da lista e agregados por cliente                   */
/* ------------------------------------------------------------------ */

/** Estados em que o pagamento foi de fato capturado — o que conta como "pedido pago" para métricas. */
const STATUS_PAGOS: readonly StatusPedido[] = [
  'pago',
  'em_separacao',
  'enviado',
  'pronto_para_retirada',
  'entregue',
];

/**
 * Testes de mesa:
 *   pedidoFoiPago('pago')                 → true
 *   pedidoFoiPago('entregue')             → true
 *   pedidoFoiPago('aguardando_pagamento') → false
 *   pedidoFoiPago('cancelado')            → false
 */
export function pedidoFoiPago(status: StatusPedido): boolean {
  return (STATUS_PAGOS as readonly StatusPedido[]).includes(status);
}

export interface FiltrosDePedidos {
  /** Casa com número do pedido ou nome do cliente, sem acento e sem caixa. */
  busca: string;
  status: StatusPedido | '';
  /** Id exato — usado pelo link "ver pedidos" de /admin/clientes. `''` = todos. */
  clienteId: string;
}

/**
 * Lista para o painel: mais recente primeiro. Reaproveita `normalizarTexto`
 * do catálogo — mesma regra de busca sem acento usada em toda a loja.
 *
 * Testes de mesa (sobre os 4 pedidos do mock):
 *   sem filtro                          → os 4, mais recente primeiro
 *   busca 'cpa-2026-0142'               → 1 (bate pelo número)
 *   busca 'larissa'                     → os pedidos de Larissa Fontes (nome, sem acento/caixa)
 *   status 'cancelado'                  → só o pedido cancelado
 *   clienteId 'cli-001'                 → só os pedidos desse cliente
 *   busca + status juntos               → interseção dos dois
 */
export function filtrarPedidos(
  pedidos: Pedido[],
  clientes: Cliente[],
  filtros: FiltrosDePedidos,
): Pedido[] {
  const termo = normalizarTexto(filtros.busca);
  const nomeDoCliente = (clienteId: string) =>
    clientes.find((cliente) => cliente.id === clienteId)?.nome ?? '';

  return pedidos
    .filter((pedido) => {
      if (filtros.clienteId !== '' && pedido.clienteId !== filtros.clienteId) return false;
      if (filtros.status !== '' && pedido.status !== filtros.status) return false;

      if (termo !== '') {
        const alvo = normalizarTexto(`${pedido.numero} ${nomeDoCliente(pedido.clienteId)}`);
        if (!alvo.includes(termo)) return false;
      }

      return true;
    })
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

/**
 * Resumo de um cliente para `/admin/clientes` — tudo derivado dos pedidos
 * carregados, nada hardcodado. `quantidadeDePedidos` conta todos;
 * `totalGasto` soma só os pagos, para não inflar a métrica com pedido que
 * nunca chegou a pagar ou foi cancelado.
 *
 * Testes de mesa (cli-001 nos mocks: ped-001 pago/entregue-like e outros):
 *   cliente sem pedido nenhum                → { quantidadeDePedidos: 0, totalGasto: 0 }
 *   cliente com pedidos pagos e cancelados   → quantidade conta todos, totalGasto só os pagos
 */
export function resumoDoCliente(
  clienteId: string,
  pedidos: Pedido[],
): { quantidadeDePedidos: number; totalGasto: number } {
  const doCliente = pedidos.filter((pedido) => pedido.clienteId === clienteId);

  return {
    quantidadeDePedidos: doCliente.length,
    totalGasto: doCliente
      .filter((pedido) => pedidoFoiPago(pedido.status))
      .reduce((total, pedido) => total + pedido.total, 0),
  };
}

/* ------------------------------------------------------------------ */
/* 7. Painel administrativo                                            */
/* ------------------------------------------------------------------ */

const TODOS_OS_STATUS: readonly StatusPedido[] = [
  'aguardando_pagamento',
  'pago',
  'em_separacao',
  'enviado',
  'pronto_para_retirada',
  'entregue',
  'cancelado',
];

/**
 * Quantos pedidos há em cada status — os sete sempre aparecem, mesmo com
 * contagem zero, para o painel não precisar adivinhar quais existem.
 *
 * Testes de mesa (sobre os 4 pedidos do mock: 1 entregue, 1 enviado, 1
 * aguardando_pagamento, 1 cancelado):
 *   contarPedidosPorStatus(pedidos).entregue             → 1
 *   contarPedidosPorStatus(pedidos).enviado               → 1
 *   contarPedidosPorStatus(pedidos).pago                  → 0
 *   contarPedidosPorStatus([]).cancelado                  → 0
 */
export function contarPedidosPorStatus(pedidos: Pedido[]): Record<StatusPedido, number> {
  const contagem = Object.fromEntries(TODOS_OS_STATUS.map((status) => [status, 0])) as Record<
    StatusPedido,
    number
  >;

  for (const pedido of pedidos) {
    contagem[pedido.status] += 1;
  }

  return contagem;
}

/**
 * Soma do total dos pedidos pagos — a "receita" do painel. Reaproveita
 * `pedidoFoiPago`: o mesmo critério usado em `resumoDoCliente`.
 *
 * Testes de mesa (sobre os 4 pedidos do mock):
 *   receitaDosPedidosPagos(pedidos) → soma de ped-001 (entregue) e ped-002 (enviado)
 *   receitaDosPedidosPagos([])      → 0
 */
export function receitaDosPedidosPagos(pedidos: Pedido[]): number {
  return pedidos
    .filter((pedido) => pedidoFoiPago(pedido.status))
    .reduce((total, pedido) => total + pedido.total, 0);
}
