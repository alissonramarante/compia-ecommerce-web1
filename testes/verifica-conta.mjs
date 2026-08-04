import { carregarModulo, criarPlacar } from './arnes.mjs';

const c = await carregarModulo('src/lib/conta.ts', 'conta');
const fmt = await carregarModulo('src/lib/formatadores.ts', 'formatadoresConta');
const { produtos } = await carregarModulo('src/mocks/produtos.ts', 'produtos');
const { pedidos } = await carregarModulo('src/mocks/pedidos.ts', 'pedidosMock');

const { conferir, secao, encerrar } = criarPlacar();

const ped = (numero) => pedidos.find((p) => p.numero === numero);
const AGORA = '2026-08-04T12:00:00Z';

/* ============ 1. abas ============ */
secao('lerAba');
conferir('downloads', c.lerAba('downloads'), 'downloads');
conferir('dados', c.lerAba('dados'), 'dados');
conferir('pedidos', c.lerAba('pedidos'), 'pedidos');
conferir('valor invalido cai no padrao', c.lerAba('xpto'), 'pedidos');
conferir('null cai no padrao', c.lerAba(null), 'pedidos');
conferir('vazio cai no padrao', c.lerAba(''), 'pedidos');
conferir('sao tres abas', c.ABAS.length, 3);

/* ============ 2. tempo restante ============ */
secao('tempoRestante');
const VENCE = '2026-08-04T12:30:00Z';
conferir('30 minutos', c.tempoRestante(VENCE, AGORA), '30 min');
conferir('arredonda para cima', c.tempoRestante(VENCE, '2026-08-04T12:29:10Z'), '1 min');
conferir('mais de uma hora', c.tempoRestante(VENCE, '2026-08-04T11:00:00Z'), '2 h');
conferir('no vencimento devolve vazio', c.tempoRestante(VENCE, VENCE), '');
conferir('depois do vencimento devolve vazio', c.tempoRestante(VENCE, '2026-08-04T13:00:00Z'), '');
conferir('data invalida devolve vazio', c.tempoRestante('nao e data', AGORA), '');

/* ============ 3. CPF ============ */
secao('CPF');
conferir('mascara preserva o miolo', fmt.mascararCpf('123.456.789-00'), '***.456.789-**');
conferir('mascara aceita sem pontuacao', fmt.mascararCpf('12345678900'), '***.456.789-**');
conferir('outro cliente', fmt.mascararCpf('987.654.321-00'), '***.654.321-**');
conferir('cpf curto esconde tudo', fmt.mascararCpf('123'), '***.***.***-**');
conferir('cpf vazio esconde tudo', fmt.mascararCpf(''), '***.***.***-**');
conferir('revelado e pontuado', fmt.formatarCpf('12345678900'), '123.456.789-00');
conferir('revelado idempotente', fmt.formatarCpf('123.456.789-00'), '123.456.789-00');
conferir('revelado nao inventa', fmt.formatarCpf('123'), '123');

/* ============ 4. downloads ============ */
secao('downloadsDoCliente');
const deUm = c.downloadsDoCliente(pedidos, 'cli-001');
conferir('ped-001 entregue gera 1 grupo', deUm.length, 1);
conferir('duas cotas (pdf e epub)', deUm[0].cotas.length, 2);
conferir('titulo vem do item do pedido', deUm[0].titulo, 'Segurança de Modelos de Linguagem');
conferir('formatos', deUm[0].cotas.map((x) => x.formato), ['pdf', 'epub']);
conferir('cada cota traz o numero do pedido', deUm[0].cotas[0].numeroDoPedido, 'CPA-2026-0139');
conferir('cota comeca com 5', deUm[0].cotas[0].downloadsRestantes, 5);

conferir('cliente sem e-book nao tem grupo', c.downloadsDoCliente(pedidos, 'cli-002'), []);
conferir('cliente inexistente', c.downloadsDoCliente(pedidos, 'cli-999'), []);

/* Pedido cancelado NÃO libera download, mesmo com downloads gravado. */
const canceladoComArquivo = {
  ...ped('CPA-2026-0139'),
  id: 'ped-cancelado',
  clienteId: 'cli-002',
  status: 'cancelado',
};
conferir('cancelado nao libera download', c.downloadsDoCliente([canceladoComArquivo], 'cli-002'), []);
conferir('aguardando pagamento nao libera', c.downloadsDoCliente([{ ...canceladoComArquivo, status: 'aguardando_pagamento' }], 'cli-002'), []);
conferir('em separacao nao libera', c.downloadsDoCliente([{ ...canceladoComArquivo, status: 'em_separacao' }], 'cli-002'), []);
conferir('pago libera', c.downloadsDoCliente([{ ...canceladoComArquivo, status: 'pago' }], 'cli-002').length, 1);
conferir('entregue libera', c.downloadsDoCliente([{ ...canceladoComArquivo, status: 'entregue' }], 'cli-002').length, 1);

/* Duas compras do mesmo e-book: duas cotas independentes, nunca somadas. */
const segundaCompra = {
  ...ped('CPA-2026-0139'),
  id: 'ped-005',
  numero: 'CPA-2026-0144',
  downloads: ped('CPA-2026-0139').downloads.map((d) => ({ ...d, downloadsRestantes: 2 })),
};
const duasCompras = c.downloadsDoCliente([ped('CPA-2026-0139'), segundaCompra], 'cli-001');
conferir('mesmo e-book duas vezes: 1 grupo', duasCompras.length, 1);
conferir('mas 4 cotas (2 formatos x 2 compras)', duasCompras[0].cotas.length, 4);
conferir('cotas nao sao somadas', duasCompras[0].cotas.map((x) => x.downloadsRestantes), [5, 5, 2, 2]);
conferir('cotas trazem pedidos diferentes', [...new Set(duasCompras[0].cotas.map((x) => x.numeroDoPedido))].sort(), ['CPA-2026-0139', 'CPA-2026-0144']);

/* ============ 5. descontar ============ */
secao('descontarDownload');
const base = ped('CPA-2026-0139');
const apos = c.descontarDownload(base, 'prod-005', 'pdf');
conferir('desconta 1 do formato pedido', apos.downloads[0].downloadsRestantes, 4);
conferir('outro formato fica intacto', apos.downloads[1].downloadsRestantes, 5);
conferir('pedido original nao muta', base.downloads[0].downloadsRestantes, 5);
const zerado = { ...base, downloads: base.downloads.map((d) => ({ ...d, downloadsRestantes: 1 })) };
conferir('de 1 vai a 0', c.descontarDownload(zerado, 'prod-005', 'pdf').downloads[0].downloadsRestantes, 0);
const noZero = { ...base, downloads: base.downloads.map((d) => ({ ...d, downloadsRestantes: 0 })) };
conferir('nao fica negativo', c.descontarDownload(noZero, 'prod-005', 'pdf').downloads[0].downloadsRestantes, 0);
conferir('pedido sem downloads volta igual', c.descontarDownload(ped('CPA-2026-0140'), 'x', 'pdf'), ped('CPA-2026-0140'));
conferir('produto que nao esta na lista nao muda nada', c.descontarDownload(base, 'prod-999', 'pdf').downloads[0].downloadsRestantes, 5);

/* ============ 6. comprar de novo ============ */
secao('planejarRecompra');
const tudoOk = c.planejarRecompra(ped('CPA-2026-0140'), produtos); // kit, estoque 12
conferir('tudo disponivel: 1 item', tudoOk.adicionaveis.length, 1);
conferir('quantidade preservada', tudoOk.adicionaveis[0].quantidade, 1);
conferir('sem aviso', tudoOk.aviso, '');
conferir('nao esta vazio', tudoOk.vazio, false);

/* ped-003: prod-002 (estoque 7) + prod-010 (e-book) — ambos disponíveis. */
const misto = c.planejarRecompra(ped('CPA-2026-0141'), produtos);
conferir('pedido misto: 2 itens', misto.adicionaveis.length, 2);

/* prod-008 está esgotado nos mocks. */
const comEsgotado = {
  ...ped('CPA-2026-0140'),
  itens: [
    { produtoId: 'prod-001', titulo: 'Fundamentos de Aprendizado Profundo', tipo: 'fisico', quantidade: 1, precoUnitario: 15900 },
    { produtoId: 'prod-008', titulo: 'Engenharia de Dados para IA', tipo: 'fisico', quantidade: 1, precoUnitario: 19900 },
  ],
};
const plano = c.planejarRecompra(comEsgotado, produtos);
conferir('esgotado e omitido', plano.adicionaveis.map((x) => x.produto.id), ['prod-001']);
conferir('omissao e relatada com o titulo', plano.aviso, 'Engenharia de Dados para IA não está disponível e ficou de fora.');
conferir('nao esta vazio: sobrou 1', plano.vazio, false);

const comFantasma = { ...comEsgotado, itens: [{ produtoId: 'prod-999', titulo: 'Título Sumido', tipo: 'fisico', quantidade: 1, precoUnitario: 100 }] };
const planoFantasma = c.planejarRecompra(comFantasma, produtos);
conferir('produto inexistente e omitido', planoFantasma.adicionaveis, []);
conferir('e relatado pelo titulo congelado', planoFantasma.aviso.includes('Título Sumido'), true);
conferir('nada adicionavel marca vazio', planoFantasma.vazio, true);

const acimaDoEstoque = { ...comEsgotado, itens: [{ produtoId: 'prod-006', titulo: 'Algoritmos de Busca e Planejamento', tipo: 'fisico', quantidade: 9, precoUnitario: 14200 }] };
const planoAjustado = c.planejarRecompra(acimaDoEstoque, produtos);
conferir('quantidade limitada ao estoque', planoAjustado.adicionaveis[0].quantidade, 3);
conferir('ajuste e relatado', planoAjustado.aviso.includes('reduzida ao estoque disponível'), true);

const soIndisponiveis = { ...comEsgotado, itens: [{ produtoId: 'prod-008', titulo: 'Engenharia de Dados para IA', tipo: 'fisico', quantidade: 1, precoUnitario: 19900 }] };
conferir('so indisponiveis: vazio', c.planejarRecompra(soIndisponiveis, produtos).vazio, true);

const doisOmitidos = { ...comEsgotado, itens: [
  { produtoId: 'prod-008', titulo: 'Engenharia de Dados para IA', tipo: 'fisico', quantidade: 1, precoUnitario: 1 },
  { produtoId: 'prod-999', titulo: 'Título Sumido', tipo: 'fisico', quantidade: 1, precoUnitario: 1 },
] };
conferir('dois omitidos: aviso no plural', c.planejarRecompra(doisOmitidos, produtos).aviso.includes('2 títulos'), true);

conferir('e-book recomprado vale 1', c.planejarRecompra({ ...comEsgotado, itens: [{ produtoId: 'prod-005', titulo: 'x', tipo: 'ebook', quantidade: 3, precoUnitario: 6900 }] }, produtos).adicionaveis[0].quantidade, 1);
conferir('mensagem de recompra impossivel diz que nada mudou', c.AVISO_DE_RECOMPRA_IMPOSSIVEL.includes('carrinho não foi alterado'), true);

encerrar();
