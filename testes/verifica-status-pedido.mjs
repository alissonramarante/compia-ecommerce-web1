import { carregarModulo, criarPlacar } from './arnes.mjs';

const lib = await carregarModulo('src/lib/statusPedido.ts', 'statusPedido');
const { pedidos } = await carregarModulo('src/mocks/pedidos.ts', 'pedidosMockParaStatus');

const { conferir, secao, encerrar } = criarPlacar();

const p = (numero) => pedidos.find((x) => x.numero === numero);

/* ============ 1. transicoesValidas ============ */
secao('transicoesValidas');
conferir('aguardando_pagamento', lib.transicoesValidas('aguardando_pagamento'), ['cancelado']);
conferir('pago', lib.transicoesValidas('pago'), ['em_separacao', 'cancelado']);
conferir('em_separacao', lib.transicoesValidas('em_separacao'), ['enviado', 'cancelado']);
conferir('enviado', lib.transicoesValidas('enviado'), ['entregue', 'cancelado']);
conferir('pronto_para_retirada', lib.transicoesValidas('pronto_para_retirada'), ['entregue', 'cancelado']);
conferir('entregue e terminal', lib.transicoesValidas('entregue'), []);
conferir('cancelado e terminal', lib.transicoesValidas('cancelado'), []);

/* ============ 2. transicaoValida ============ */
secao('transicaoValida');
conferir('pago -> em_separacao', lib.transicaoValida('pago', 'em_separacao'), true);
conferir('entregue -> aguardando_pagamento (nunca)', lib.transicaoValida('entregue', 'aguardando_pagamento'), false);
conferir('em_separacao -> entregue (pula etapa)', lib.transicaoValida('em_separacao', 'entregue'), false);
conferir('aguardando_pagamento -> pago (automatico, nao manual)', lib.transicaoValida('aguardando_pagamento', 'pago'), false);
conferir('cancelado -> qualquer coisa', lib.transicaoValida('cancelado', 'pago'), false);

/* Os dois estados terminais não aceitam NENHUMA transição, nem para
   'cancelado' — a mesma armadilha de "enviado" (estoque devolvido para
   mercadoria que já saiu) valeria também para 'entregue' se essa transição
   fosse permitida, e 'cancelado -> cancelado' rodaria devolverEstoque duas
   vezes se não fosse barrado. */
conferir('entregue -> cancelado (proibido: mercadoria ja entregue)', lib.transicaoValida('entregue', 'cancelado'), false);
conferir('entregue -> entregue (terminal, nem para si mesmo)', lib.transicaoValida('entregue', 'entregue'), false);
conferir('cancelado -> cancelado (terminal, nem para si mesmo)', lib.transicaoValida('cancelado', 'cancelado'), false);
const TODOS_OS_STATUS = [
  'aguardando_pagamento',
  'pago',
  'em_separacao',
  'enviado',
  'pronto_para_retirada',
  'entregue',
  'cancelado',
];
conferir('nenhum dos sete status transiciona para si mesmo', TODOS_OS_STATUS.every((status) => !lib.transicaoValida(status, status)), true);

/* ============ 3. cancelamentoDevolveEstoque ============ */
secao('cancelamentoDevolveEstoque');
conferir('aguardando_pagamento devolve', lib.cancelamentoDevolveEstoque('aguardando_pagamento'), true);
conferir('pago devolve', lib.cancelamentoDevolveEstoque('pago'), true);
conferir('em_separacao devolve', lib.cancelamentoDevolveEstoque('em_separacao'), true);
conferir('pronto_para_retirada devolve (nunca saiu do balcao)', lib.cancelamentoDevolveEstoque('pronto_para_retirada'), true);
conferir('enviado NAO devolve (ja saiu fisicamente)', lib.cancelamentoDevolveEstoque('enviado'), false);

/* ============ 4. erroDaMudancaDeStatus ============ */
secao('erroDaMudancaDeStatus');
conferir('transicao valida sem exigencia extra', lib.erroDaMudancaDeStatus('pago', 'em_separacao'), null);
conferir('transicao valida para cancelado nao exige rastreio', lib.erroDaMudancaDeStatus('pago', 'cancelado'), null);
conferir('transicao invalida (entregue e terminal)', typeof lib.erroDaMudancaDeStatus('entregue', 'cancelado'), 'string');
conferir('transicao invalida (cancelado -> cancelado, ja e terminal)', typeof lib.erroDaMudancaDeStatus('cancelado', 'cancelado'), 'string');
conferir('enviado sem codigo de rastreio', typeof lib.erroDaMudancaDeStatus('em_separacao', 'enviado'), 'string');
conferir('enviado com codigo so de espacos', typeof lib.erroDaMudancaDeStatus('em_separacao', 'enviado', { codigoRastreio: '   ' }), 'string');
conferir('enviado com codigo de rastreio', lib.erroDaMudancaDeStatus('em_separacao', 'enviado', { codigoRastreio: 'BR123456789BR' }), null);

/* ============ 5. mudarStatus ============ */
secao('mudarStatus');
const AGORA = '2026-08-05T10:00:00Z';
const emSeparacao = p('CPA-2026-0140'); // ped-002, status 'enviado' no mock — vamos simular a partir de em_separacao
const pedidoBase = { ...emSeparacao, status: 'em_separacao', historico: emSeparacao.historico.slice(0, 3) };

const enviado = lib.mudarStatus(pedidoBase, 'enviado', AGORA, { codigoRastreio: ' BR999888777BR ' });
conferir('status novo', enviado.status, 'enviado');
conferir('historico ganha um evento', enviado.historico.length, pedidoBase.historico.length + 1);
conferir('evento novo tem o status e a hora certos', enviado.historico[enviado.historico.length - 1], { status: 'enviado', em: AGORA, observacao: undefined });
conferir('codigo de rastreio vai para entrega, aparado', enviado.entrega.codigoRastreio, 'BR999888777BR');
conferir('atualizadoEm', enviado.atualizadoEm, AGORA);
conferir('pedido original intacto', pedidoBase.status, 'em_separacao');
conferir('pedido original sem o evento novo', pedidoBase.historico.length, emSeparacao.historico.slice(0, 3).length);

const comObservacao = lib.mudarStatus(pedidoBase, 'cancelado', AGORA, { observacao: 'Cliente desistiu' });
conferir('observacao vai para o evento', comObservacao.historico[comObservacao.historico.length - 1].observacao, 'Cliente desistiu');
conferir('sem codigoRastreio: entrega nao muda', comObservacao.entrega, pedidoBase.entrega);

const semOpcoes = lib.mudarStatus(pedidoBase, 'cancelado', AGORA);
conferir('sem opcoes: observacao fica undefined', semOpcoes.historico[semOpcoes.historico.length - 1].observacao, undefined);

/* ============ 6. mensagemDeEmailEnviado ============ */
secao('mensagemDeEmailEnviado');
conferir('mensagem pronta', lib.mensagemDeEmailEnviado('cliente@exemplo.com'), 'E-mail de confirmação enviado para cliente@exemplo.com.');

encerrar();
