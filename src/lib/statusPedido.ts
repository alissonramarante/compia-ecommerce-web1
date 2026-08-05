import type { Entrega, EventoPedido, Pedido, StatusPedido } from '../types';

/**
 * Máquina de transições do painel admin. Diferente de `aplicarPagamento`
 * (que decide o status a partir do resultado de uma cobrança), aqui é uma
 * pessoa da equipe escolhendo o próximo passo — e nem toda transição faz
 * sentido: `entregue` é terminal, não volta para `aguardando_pagamento`.
 *
 * `aguardando_pagamento` e `pago` cobrem o pedido antes de sair da editora;
 * `pronto_para_retirada` é o equivalente de `enviado` para quem retira no
 * balcão — os dois nascem de `pago` na prática, mas nunca coexistem: um
 * pedido de retirada pula direto de `aguardando_pagamento` para
 * `pronto_para_retirada` em `aplicarPagamento`, então `enviado` nunca é uma
 * transição alcançável para ele.
 */

const TRANSICOES: Record<StatusPedido, StatusPedido[]> = {
  aguardando_pagamento: ['cancelado'],
  pago: ['em_separacao', 'cancelado'],
  em_separacao: ['enviado', 'cancelado'],
  enviado: ['entregue', 'cancelado'],
  pronto_para_retirada: ['entregue', 'cancelado'],
  entregue: [],
  cancelado: [],
};

/**
 * Testes de mesa:
 *   transicoesValidas('pago')       → ['em_separacao', 'cancelado']
 *   transicoesValidas('entregue')   → []
 *   transicoesValidas('cancelado')  → []
 */
export function transicoesValidas(status: StatusPedido): StatusPedido[] {
  return TRANSICOES[status];
}

/**
 * Testes de mesa:
 *   transicaoValida('pago', 'em_separacao')       → true
 *   transicaoValida('entregue', 'aguardando_pagamento') → false
 *   transicaoValida('em_separacao', 'entregue')   → false (pula etapa)
 */
export function transicaoValida(de: StatusPedido, para: StatusPedido): boolean {
  return TRANSICOES[de].includes(para);
}

/**
 * Decide se cancelar devolve estoque. O estoque já foi baixado na criação do
 * pedido (Tarefa 0), então cancelar antes do despacho é reverter uma baixa
 * que não vai virar entrega mesmo. Depois de `enviado` o produto já saiu
 * fisicamente do estoque da editora — cancelar a partir daí é estorno
 * financeiro, não devolução de mercadoria, e devolver ao estoque um item que
 * está fisicamente a caminho do cliente inventaria unidade que não existe.
 *
 * Testes de mesa:
 *   cancelamentoDevolveEstoque('aguardando_pagamento') → true
 *   cancelamentoDevolveEstoque('pago')                 → true
 *   cancelamentoDevolveEstoque('em_separacao')          → true
 *   cancelamentoDevolveEstoque('pronto_para_retirada')  → true (nunca saiu do balcão)
 *   cancelamentoDevolveEstoque('enviado')                → false
 */
export function cancelamentoDevolveEstoque(statusAtual: StatusPedido): boolean {
  return statusAtual !== 'enviado';
}

/**
 * Erro da mudança de status, pronto para exibir — `null` quando pode
 * prosseguir. A página só chama e decide se desenha o botão desabilitado ou
 * a mensagem; a regra mora aqui.
 *
 * Testes de mesa:
 *   'pago' → 'em_separacao', sem exigência extra        → null
 *   'entregue' → 'cancelado' (entregue é terminal)       → mensagem de transição inválida
 *   'em_separacao' → 'enviado' sem código de rastreio    → pede o código
 *   'em_separacao' → 'enviado' com código de rastreio    → null
 *   'em_separacao' → 'enviado' com código só de espaços  → pede o código
 *   'pago' → 'cancelado' (nao exige rastreio)            → null
 */
export function erroDaMudancaDeStatus(
  statusAtual: StatusPedido,
  novoStatus: StatusPedido,
  opcoes: { codigoRastreio?: string } = {},
): string | null {
  if (!transicaoValida(statusAtual, novoStatus)) {
    return 'Esta transição de status não é permitida a partir do estado atual.';
  }

  if (novoStatus === 'enviado' && (opcoes.codigoRastreio ?? '').trim() === '') {
    return 'Informe o código de rastreio para marcar como enviado.';
  }

  return null;
}

/**
 * Aplica a mudança de status já validada por `erroDaMudancaDeStatus` — esta
 * função confia no chamador, como `criarPedido` confia no carrinho. Grava um
 * `EventoPedido` com observação opcional e, em `enviado`, o código de
 * rastreio em `Entrega.codigoRastreio`.
 *
 * Testes de mesa (ped-002, em_separacao → enviado, agora = '2026-08-05T10:00:00Z'):
 *   status novo                    → 'enviado'
 *   historico ganha um evento      → { status: 'enviado', em: agora, observacao: undefined }
 *   com observação                 → observacao preenchida no evento novo
 *   codigoRastreio vai para entrega → entrega.codigoRastreio === o código passado
 *   atualizadoEm                   → agora
 *   pedido original intacto        → não muta a entrada
 *   transição sem código de rastreio (chamada direta, sem validar) → aplica mesmo assim, campo fica ausente
 */
export function mudarStatus(
  pedido: Pedido,
  novoStatus: StatusPedido,
  agora: string,
  opcoes: { observacao?: string; codigoRastreio?: string } = {},
): Pedido {
  const entrega: Entrega =
    opcoes.codigoRastreio !== undefined
      ? { ...pedido.entrega, codigoRastreio: opcoes.codigoRastreio.trim() }
      : pedido.entrega;

  const evento: EventoPedido = { status: novoStatus, em: agora, observacao: opcoes.observacao };

  return {
    ...pedido,
    status: novoStatus,
    entrega,
    historico: [...pedido.historico, evento],
    atualizadoEm: agora,
  };
}

/**
 * Texto do toast de notificação simulada — nasce aqui, pronto, como os
 * demais textos de aviso do projeto.
 *
 * Testes de mesa:
 *   mensagemDeEmailEnviado('cliente@example.com') → 'E-mail de confirmação enviado para cliente@example.com.'
 */
export function mensagemDeEmailEnviado(email: string): string {
  return `E-mail de confirmação enviado para ${email}.`;
}
