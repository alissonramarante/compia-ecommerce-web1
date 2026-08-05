import { carregarArnes, criarPlacar } from './arnes.mjs';

const { renderizarComProvedores } = await carregarArnes();
const { caso, secao, encerrar } = criarPlacar();

const ADMIN = { clienteId: 'cli-001', usuarioId: 'usr-001' }; // Renata, admin
const VENDEDOR = { clienteId: 'cli-001', usuarioId: 'usr-003' }; // Cláudia, vendedor
const EDITOR = { clienteId: 'cli-001', usuarioId: 'usr-002' }; // Gustavo, editor

const pagina = (rota, sessao = ADMIN) => renderizarComProvedores(rota, { sessao });

/* ============ 1. conteúdo ============ */
secao('conteúdo');
const lista = pagina('/admin/logs');
caso('titulo da pagina', lista.includes('>Logs<'));
caso('mostra o autor (nome, nao so o id)', lista.includes('Gustavo Peixoto') && lista.includes('Cláudia Menezes') && lista.includes('Renata Coutinho'));
caso('acao legivel, nao a chave crua', lista.includes('Login') && !lista.includes('>login<'));
caso('entidade', lista.includes('usuario') || lista.includes('produto') || lista.includes('pedido'));
caso('descricao', lista.includes('Acessou o painel administrativo'));
caso('data formatada', lista.includes('25/02/2026'));
caso('contagem de registros', lista.includes('3 registros'));

/* ============ 2. mais recente primeiro ============ */
secao('ordenação');
const idxLogin = lista.indexOf('Acessou o painel administrativo'); // log-003, 25/02
const idxProdutoCriado = lista.indexOf('Cadastrou'); // log-001, 18/02
caso('log mais recente (login, 25/02) aparece antes do mais antigo (produto_criado, 18/02)', idxLogin !== -1 && idxProdutoCriado !== -1 && idxLogin < idxProdutoCriado);

/* ============ 3. filtro por ação ============ */
secao('filtro por ação');
const filtroLogin = renderizarComProvedores('/admin/logs?acao=login', { sessao: ADMIN });
caso('filtro por acao mostra so 1 registro', filtroLogin.includes('1 registro'));
caso('filtro por acao mantem a descricao certa', filtroLogin.includes('Acessou o painel administrativo'));
caso('filtro por acao exclui os demais', !filtroLogin.includes('Cadastrou'));

/* ============ 4. filtro por usuário ============ */
secao('filtro por usuário');
const filtroUsuario = renderizarComProvedores('/admin/logs?usuario=usr-002', { sessao: ADMIN });
caso('filtro por usuario mostra so os dele', filtroUsuario.includes('1 registro') && filtroUsuario.includes('Cadastrou'));

const semResultado = renderizarComProvedores('/admin/logs?acao=logout', { sessao: ADMIN });
caso('sem resultado: mensagem, sem tabela', semResultado.includes('Nenhum registro com esses filtros.') && !semResultado.includes('<table'));
caso('sem resultado: oferece limpar filtros', semResultado.includes('Limpar filtros'));

/* ============ 5. só admin acessa ============ */
secao('permissões');
caso('editor barrado', pagina('/admin/logs', EDITOR).includes('Você não tem acesso a esta área.'));
caso('vendedor barrado', pagina('/admin/logs', VENDEDOR).includes('Você não tem acesso a esta área.'));
caso('vendedor: mensagem diz o que ele alcança (sem Logs)', pagina('/admin/logs', VENDEDOR).includes('Ele alcança: Produtos, Pedidos, Clientes.'));
caso('admin acessa', lista.includes('<table'));

encerrar();
