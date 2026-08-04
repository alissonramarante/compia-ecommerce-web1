import { carregarModulo, criarPlacar } from './arnes.mjs';

const lib = await carregarModulo('src/lib/pedido.ts', 'pedido');
const arm = await carregarModulo('src/lib/pedidosArmazenados.ts', 'pedidosArmazenados');
const ctx = await carregarModulo('src/contexts/PedidosContext.tsx', 'pedidosContext');
const { produtos } = await carregarModulo('src/mocks/produtos.ts', 'produtos');
const { clientes } = await carregarModulo('src/mocks/clientes.ts', 'clientes');
const { pedidos } = await carregarModulo('src/mocks/pedidos.ts', 'pedidosMock');

const { conferir, secao, encerrar } = criarPlacar();

const p = (id) => produtos.find((x) => x.id === id);
const cli = (id) => clientes.find((x) => x.id === id);
const AGORA = '2026-08-04T12:00:00Z';

const carrinho = (...pares) =>
  pares.map(([id, quantidade]) => ({
    produtoId: id,
    quantidade,
    precoUnitario: p(id).precoPromocional ?? p(id).preco,
  }));

const entregaEnvio = {
  modalidade: 'envio',
  endereco: cli('cli-001').enderecos[0],
  opcaoFrete: { id: 'frete-padrao', nome: 'Entrega padrão', transportadora: 'Correios — PAC', valor: 2100, prazoDiasUteis: 2 },
  valor: 2100,
};
const entregaRetirada = { modalidade: 'retirada', valor: 0 };
const entregaDownload = { modalidade: 'download', valor: 0 };

const pagamentoAprovado = { metodo: 'cartao', status: 'aprovado', valor: 0, parcelas: 1, ultimosDigitos: '1486', bandeira: 'visa' };
const pagamentoRecusado = { ...pagamentoAprovado, status: 'recusado' };
const pagamentoPendente = { metodo: 'pix', status: 'pendente', valor: 0, parcelas: 1 };

/* ============ 1. numeração ============ */
secao('gerarNumeroPedido');
conferir('segue a partir do maior de 2026', lib.gerarNumeroPedido(pedidos, 2026), 'CPA-2026-0143');
conferir('ano sem pedido comeca em 0001', lib.gerarNumeroPedido(pedidos, 2027), 'CPA-2027-0001');
conferir('lista vazia comeca em 0001', lib.gerarNumeroPedido([], 2026), 'CPA-2026-0001');
conferir('nao se confunde com outro ano', lib.gerarNumeroPedido([{ numero: 'CPA-2025-0999' }], 2026), 'CPA-2026-0001');
conferir('numero malformado e ignorado', lib.gerarNumeroPedido([...pedidos, { numero: 'CPA-2026-abc' }], 2026), 'CPA-2026-0143');
conferir('pega o maior, nao o ultimo', lib.gerarNumeroPedido([{ numero: 'CPA-2026-0500' }, { numero: 'CPA-2026-0100' }], 2026), 'CPA-2026-0501');
conferir('mantem 4 digitos', lib.gerarNumeroPedido([{ numero: 'CPA-2026-0009' }], 2026), 'CPA-2026-0010');
conferir('passa de 4 digitos sem truncar', lib.gerarNumeroPedido([{ numero: 'CPA-2026-9999' }], 2026), 'CPA-2026-10000');

/* ============ 2. downloads ============ */
secao('montarDownloads');
const tresFormatos = lib.montarDownloads([{ produtoId: 'prod-005' }], produtos);
conferir('um por formato', tresFormatos.length, 3);
conferir('formatos na ordem do mock', tresFormatos.map((d) => d.formato), ['pdf', 'epub', 'mobi']);
conferir('5 downloads por formato', tresFormatos[0].downloadsRestantes, 5);
conferir('url pelo slug', tresFormatos[0].url, '/downloads/seguranca-de-modelos-de-linguagem.pdf');
conferir('revista tem 1 formato', lib.montarDownloads([{ produtoId: 'prod-007' }], produtos).length, 1);
conferir('fisico nao gera download', lib.montarDownloads([{ produtoId: 'prod-001' }], produtos), []);
conferir('kit nao gera download', lib.montarDownloads([{ produtoId: 'prod-009' }], produtos), []);
conferir('mistura: so o e-book conta', lib.montarDownloads([{ produtoId: 'prod-005' }, { produtoId: 'prod-001' }], produtos).length, 3);
conferir('produto fantasma e ignorado', lib.montarDownloads([{ produtoId: 'zzz' }], produtos), []);
conferir('lista vazia', lib.montarDownloads([], produtos), []);

/* ============ 3. criarPedido ============ */
secao('criarPedido');
const novo = lib.criarPedido({
  cliente: cli('cli-001'),
  itens: carrinho(['prod-001', 2], ['prod-005', 1]),
  produtos,
  entrega: entregaEnvio,
  pagamento: pagamentoAprovado,
  numero: 'CPA-2026-0143',
  agora: AGORA,
});
conferir('id derivado do numero', novo.id, 'ped-CPA-2026-0143');
conferir('numero', novo.numero, 'CPA-2026-0143');
conferir('cliente', novo.clienteId, 'cli-001');
conferir('titulo congelado', novo.itens[0].titulo, 'Fundamentos de Aprendizado Profundo');
conferir('tipo congelado', novo.itens.map((i) => i.tipo), ['fisico', 'ebook']);
conferir('preco vem do carrinho', novo.itens[0].precoUnitario, 15900);
conferir('subtotal', novo.subtotal, 15900 * 2 + 6900);
conferir('total = subtotal + frete', novo.total, 15900 * 2 + 6900 + 2100);
conferir('pagamento.valor alinhado ao total', novo.pagamento.valor, novo.total);
conferir('nasce aguardando pagamento', novo.status, 'aguardando_pagamento');
conferir('primeiro evento no historico', novo.historico, [{ status: 'aguardando_pagamento', em: AGORA }]);
conferir('criadoEm', novo.criadoEm, AGORA);
conferir('atualizadoEm', novo.atualizadoEm, AGORA);
conferir('sem downloads ainda', novo.downloads, undefined);
conferir('item fantasma e descartado', lib.criarPedido({ cliente: cli('cli-001'), itens: [{ produtoId: 'zzz', quantidade: 1, precoUnitario: 100 }], produtos, entrega: entregaRetirada, pagamento: pagamentoAprovado, numero: 'X', agora: AGORA }).itens, []);
conferir('nao muta o carrinho recebido', (() => { const itens = carrinho(['prod-001', 1]); lib.criarPedido({ cliente: cli('cli-001'), itens, produtos, entrega: entregaRetirada, pagamento: pagamentoAprovado, numero: 'X', agora: AGORA }); return itens[0].quantidade; })(), 1);

/* ============ 4. aplicarPagamento: as quatro transições ============ */
secao('aplicarPagamento');
const comFisico = lib.criarPedido({ cliente: cli('cli-001'), itens: carrinho(['prod-001', 1]), produtos, entrega: entregaEnvio, pagamento: pagamentoAprovado, numero: 'N1', agora: AGORA });
const comRetirada = lib.criarPedido({ cliente: cli('cli-001'), itens: carrinho(['prod-001', 1]), produtos, entrega: entregaRetirada, pagamento: pagamentoAprovado, numero: 'N2', agora: AGORA });
const soEbook = lib.criarPedido({ cliente: cli('cli-001'), itens: carrinho(['prod-005', 1]), produtos, entrega: entregaDownload, pagamento: pagamentoAprovado, numero: 'N3', agora: AGORA });

const DEPOIS = '2026-08-04T12:05:00Z';

const pago = lib.aplicarPagamento(comFisico, pagamentoAprovado, DEPOIS, produtos);
conferir('1. aprovado + fisico -> pago', pago.status, 'pago');
conferir('historico ganha um evento', pago.historico.length, 2);
conferir('evento traz observacao', pago.historico[1].observacao, 'Pagamento aprovado.');
conferir('pagoEm preenchido', pago.pagamento.pagoEm, DEPOIS);
conferir('atualizadoEm', pago.atualizadoEm, DEPOIS);
conferir('sem downloads', pago.downloads, undefined);

const retirada = lib.aplicarPagamento(comRetirada, pagamentoAprovado, DEPOIS, produtos);
conferir('2. aprovado + retirada -> pronto_para_retirada', retirada.status, 'pronto_para_retirada');
conferir('observacao da retirada', retirada.historico[1].observacao, 'Pagamento aprovado. Disponível para retirada na sede.');

const entregue = lib.aplicarPagamento(soEbook, pagamentoAprovado, DEPOIS, produtos);
conferir('3. aprovado + so e-book -> entregue', entregue.status, 'entregue');
conferir('ganha downloads', entregue.downloads.length, 3);
conferir('downloads com 5 restantes', entregue.downloads[0].downloadsRestantes, 5);
conferir('observacao do download', entregue.historico[1].observacao, 'Pagamento aprovado. Download liberado.');

const cancelado = lib.aplicarPagamento(comFisico, pagamentoRecusado, DEPOIS, produtos);
conferir('4. recusado -> cancelado', cancelado.status, 'cancelado');
conferir('cancelado nao ganha downloads', cancelado.downloads, undefined);
conferir('cancelado nao marca pagoEm', cancelado.pagamento.pagoEm, undefined);
conferir('observacao da recusa', cancelado.historico[1].observacao, 'Pagamento recusado. Nenhuma cobrança foi feita.');

const pendente = lib.aplicarPagamento(comFisico, pagamentoPendente, DEPOIS, produtos);
conferir('pendente nao muda o status', pendente.status, 'aguardando_pagamento');
conferir('pendente nao cria evento', pendente.historico.length, 1);
conferir('pendente ainda atualiza a cobranca', pendente.pagamento.metodo, 'pix');
conferir('pendente atualiza a data', pendente.atualizadoEm, DEPOIS);

conferir('e-book em pedido de retirada vence a retirada', lib.aplicarPagamento({ ...soEbook, entrega: entregaRetirada }, pagamentoAprovado, DEPOIS, produtos).status, 'entregue');
conferir('pedido original intacto', comFisico.status, 'aguardando_pagamento');
conferir('historico original intacto', comFisico.historico.length, 1);

/* ============ 5. persistência ============ */
secao('pedidosArmazenados');
conferir('chave versionada', arm.CHAVE_PEDIDOS, 'compia:pedidos:v1');
conferir('ida e volta preserva os 4', arm.desserializar(arm.serializar(pedidos)).length, 4);
conferir('JSON corrompido nao lanca', arm.desserializar('{{{'), []);
conferir('string vazia', arm.desserializar(''), []);
conferir('objeto no lugar de array', arm.desserializar('{}'), []);
conferir('sem numero e descartado', arm.desserializar(JSON.stringify([{ ...pedidos[0], numero: '' }])), []);
conferir('status inventado e descartado', arm.desserializar(JSON.stringify([{ ...pedidos[0], status: 'xpto' }])), []);
conferir('itens nao-array e descartado', arm.desserializar(JSON.stringify([{ ...pedidos[0], itens: 'nao' }])), []);
conferir('total nao-numero e descartado', arm.desserializar(JSON.stringify([{ ...pedidos[0], total: 'muito' }])), []);
conferir('array misto guarda so o valido', arm.desserializar(JSON.stringify([null, pedidos[0], 'lixo'])).length, 1);

function armazenamentoFalso(inicial = {}) {
  const dados = { ...inicial };
  return { dados, getItem: (k) => (k in dados ? dados[k] : null), setItem: (k, v) => { dados[k] = String(v); }, removeItem: (k) => { delete dados[k]; } };
}

delete globalThis.localStorage;
conferir('sem localStorage: carregar da null', arm.carregar(), null);
conferir('sem localStorage: salvar nao lanca', (() => { try { arm.salvar(pedidos); return 'nao lancou'; } catch { return 'LANCOU'; } })(), 'nao lancou');
conferir('sem localStorage: semeia com os mocks', arm.carregarPedidos(pedidos).length, 4);

globalThis.localStorage = armazenamentoFalso();
conferir('nada gravado: semeia com os mocks', arm.carregarPedidos(pedidos).length, 4);
arm.salvar([pedidos[0]]);
conferir('gravado manda sobre a semente', arm.carregarPedidos(pedidos).length, 1);
globalThis.localStorage = armazenamentoFalso({ 'compia:pedidos:v1': '[]' });
conferir('gravado vazio e respeitado', arm.carregarPedidos(pedidos), []);
globalThis.localStorage = armazenamentoFalso({ 'compia:pedidos:v1': '{{{' });
conferir('gravado corrompido nao derruba', arm.carregarPedidos(pedidos), []);
globalThis.localStorage = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('modo privado'); } };
conferir('getItem que lanca: cai na semente', arm.carregarPedidos(pedidos).length, 4);
conferir('setItem que lanca nao propaga', (() => { try { arm.salvar(pedidos); return 'nao lancou'; } catch { return 'LANCOU'; } })(), 'nao lancou');
delete globalThis.localStorage;

/* ============ 6. reducer ============ */
secao('reducerPedidos');
const estado = { pedidos: [pedidos[0], pedidos[1]] };
const acrescido = ctx.reducerPedidos(estado, { tipo: 'adicionar', pedido: novo });
conferir('adicionar aumenta a lista', acrescido.pedidos.length, 3);
conferir('novo entra na frente', acrescido.pedidos[0].numero, 'CPA-2026-0143');
conferir('nao muta o estado anterior', estado.pedidos.length, 2);

const alterado = { ...pedidos[0], status: 'entregue' };
const atualizado = ctx.reducerPedidos(estado, { tipo: 'atualizar', pedido: alterado });
conferir('atualizar casa por id', atualizado.pedidos[0].status, 'entregue');
conferir('atualizar nao muda o tamanho', atualizado.pedidos.length, 2);
conferir('atualizar nao toca nos outros', atualizado.pedidos[1].status, pedidos[1].status);
conferir('atualizar pedido inexistente e inocuo', ctx.reducerPedidos(estado, { tipo: 'atualizar', pedido: { ...novo, id: 'ped-zzz' } }).pedidos.length, 2);

/* ============ 7. carga inicial ============ */
secao('criarEstadoInicial');
globalThis.localStorage = armazenamentoFalso();
conferir('sem nada gravado: os 4 mocks', ctx.criarEstadoInicial().pedidos.length, 4);
globalThis.localStorage = armazenamentoFalso({ 'compia:pedidos:v1': JSON.stringify([pedidos[2]]) });
conferir('gravado manda', ctx.criarEstadoInicial().pedidos.map((x) => x.numero), ['CPA-2026-0141']);
globalThis.localStorage = armazenamentoFalso({ 'compia:pedidos:v1': 'nao e json' });
conferir('corrompido nao derruba', ctx.criarEstadoInicial().pedidos, []);
delete globalThis.localStorage;

encerrar();
