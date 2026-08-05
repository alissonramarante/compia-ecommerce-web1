import { carregarArnes, criarPlacar } from './arnes.mjs';

const { renderizarComProvedores } = await carregarArnes();
const { caso, secao, encerrar } = criarPlacar();

const ADMIN = { clienteId: 'cli-001', usuarioId: 'usr-001' }; // Renata, admin
const VENDEDOR = { clienteId: 'cli-001', usuarioId: 'usr-003' }; // Cláudia, vendedor
const EDITOR = { clienteId: 'cli-001', usuarioId: 'usr-002' }; // Gustavo, editor

const pagina = (rota, sessao = ADMIN) => renderizarComProvedores(rota, { sessao });

/* ============ 1. lista: conteúdo ============ */
secao('lista — conteúdo');
const lista = pagina('/admin/pedidos');
caso('titulo da pagina', lista.includes('>Pedidos<'));
caso('numero do pedido', lista.includes('CPA-2026-0139'));
caso('nome do cliente', lista.includes('Yasmim Oliveira') && lista.includes('Eduardo Sampaio') && lista.includes('Larissa Fontes'));
caso('data formatada', lista.includes('19/02/2026'));
caso('status legivel', lista.includes('Entregue') && lista.includes('Cancelado'));
caso('total em mono', lista.includes('R$ 69,00'));
caso('contagem de pedidos', lista.includes('4 pedidos'));
caso('sem filtro de cliente: sem o banner', !lista.includes('Mostrando pedidos de'));

/* ============ 2. lista: filtro por status ============ */
secao('lista — filtro por status');
const cancelados = renderizarComProvedores('/admin/pedidos?status=cancelado', { sessao: ADMIN });
caso('filtro por status cancelado', cancelados.includes('1 pedido') && cancelados.includes('CPA-2026-0142'));
caso('filtro exclui os demais', !cancelados.includes('CPA-2026-0139'));

/* ============ 3. lista: busca por número ou cliente ============ */
secao('lista — busca');
const buscaNumero = renderizarComProvedores('/admin/pedidos?busca=cpa-2026-0141', { sessao: ADMIN });
caso('busca por numero (sem caixa)', buscaNumero.includes('1 pedido') && buscaNumero.includes('CPA-2026-0141'));

const buscaCliente = renderizarComProvedores('/admin/pedidos?busca=larissa', { sessao: ADMIN });
caso('busca por nome do cliente', buscaCliente.includes('CPA-2026-0141') && !buscaCliente.includes('CPA-2026-0139'));

const semResultado = renderizarComProvedores('/admin/pedidos?busca=zzzznada', { sessao: ADMIN });
caso('sem resultado: mensagem cita o termo buscado, sem tabela', semResultado.includes('Nenhum pedido para “zzzznada”.') && !semResultado.includes('<table'));
caso('sem resultado: oferece limpar filtros', semResultado.includes('Limpar filtros'));

/* ============ 4. lista: filtro por cliente (vindo de /admin/clientes) ============ */
secao('lista — filtro por cliente');
const porCliente = renderizarComProvedores('/admin/pedidos?cliente=cli-001', { sessao: ADMIN });
caso('mostra so os pedidos do cliente', porCliente.includes('CPA-2026-0139') && porCliente.includes('CPA-2026-0142') && !porCliente.includes('CPA-2026-0140'));
caso('banner nomeia o cliente', porCliente.includes('Mostrando pedidos de') && porCliente.includes('Yasmim Oliveira'));
caso('banner oferece limpar o filtro', porCliente.includes('Ver todos os pedidos'));

/* ============ 5. permissões: editor não acessa, vendedor acessa ============ */
secao('permissões');
const editorEmPedidos = pagina('/admin/pedidos', EDITOR);
caso('editor barrado na lista', editorEmPedidos.includes('Você não tem acesso a esta área.'));
const vendedorEmPedidos = pagina('/admin/pedidos', VENDEDOR);
caso('vendedor acessa a lista', vendedorEmPedidos.includes('<table'));

/* ============ 6. detalhe: conteúdo por pedido ============ */
secao('detalhe — conteúdo (CPA-2026-0140, enviado, envio)');
const detalheEnviado = pagina('/admin/pedidos/CPA-2026-0140');
caso('numero em destaque', detalheEnviado.includes('CPA-2026-0140'));
caso('nome e email do cliente', detalheEnviado.includes('Eduardo Sampaio') && detalheEnviado.includes('eduardo.sampaio@exemplo.com'));
caso('status atual', detalheEnviado.includes('Enviado'));
caso('itens do pedido', detalheEnviado.includes('Kit Trilha de IA Aplicada'));
caso('endereco de entrega', detalheEnviado.includes('Avenida Paulista'));
caso('rastreio ja registrado aparece', detalheEnviado.includes('BR748291035CG'));
caso('metodo de pagamento', detalheEnviado.includes('visa') || detalheEnviado.includes('4291'));
caso('historico completo (4 eventos do mock)', (detalheEnviado.match(/font-mono text-xs text-grafite">\d{2}\/\d{2}\/\d{4}/g) ?? []).length >= 4);

secao('detalhe — retirada e download');
const detalheRetirada = pagina('/admin/pedidos/CPA-2026-0142'); // cancelado, retirada
caso('retirada: menciona a sede', detalheRetirada.includes('Retirada na sede da editora.'));
const detalheDownload = pagina('/admin/pedidos/CPA-2026-0139'); // entregue, download
caso('download: sem frete', detalheDownload.includes('Entrega por download. Sem frete.'));

/* ============ 7. detalhe: transições oferecidas por status ============ */
secao('detalhe — transições válidas por status');
caso('enviado oferece Entregue e Cancelado', detalheEnviado.includes('id="novo-status-entregue"') && detalheEnviado.includes('id="novo-status-cancelado"'));
caso('enviado NAO oferece em_separacao de novo', !detalheEnviado.includes('id="novo-status-em_separacao"'));
caso('enviado NAO oferece aguardando_pagamento', !detalheEnviado.includes('id="novo-status-aguardando_pagamento"'));

const detalheAguardando = pagina('/admin/pedidos/CPA-2026-0141'); // aguardando_pagamento
caso('aguardando_pagamento so oferece cancelar', detalheAguardando.includes('id="novo-status-cancelado"') && !detalheAguardando.includes('id="novo-status-pago"'));

caso('entregue (terminal): sem secao de mudar status', !detalheDownload.includes('Mudar status'));
caso('cancelado (terminal): sem secao de mudar status', !detalheRetirada.includes('Mudar status'));

caso('campo de rastreio nao aparece antes de escolher "enviado"', !detalheEnviado.includes('id="codigo-rastreio"'));
caso('nenhum status inicialmente marcado (nenhum "checked" nos radios de status)', !/name="novoStatus"[^>]*checked/.test(detalheEnviado));

/* ============ 8. detalhe: pedido inexistente ============ */
secao('detalhe — inexistente');
const inexistente = pagina('/admin/pedidos/CPA-2026-9999');
caso('mensagem propria', inexistente.includes('Não encontramos este pedido.'));
caso('link de volta', inexistente.includes('href="/admin/pedidos"'));
caso('nao renderiza itens', !inexistente.includes('Itens'));

/* ============ 9. detalhe: permissões ============ */
secao('detalhe — permissões');
caso('editor barrado no detalhe', pagina('/admin/pedidos/CPA-2026-0139', EDITOR).includes('Você não tem acesso a esta área.'));
caso('vendedor acessa o detalhe', pagina('/admin/pedidos/CPA-2026-0139', VENDEDOR).includes('CPA-2026-0139'));

encerrar();
