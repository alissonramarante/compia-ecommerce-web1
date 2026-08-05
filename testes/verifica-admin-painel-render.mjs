import { carregarArnes, carregarModulo, criarPlacar } from './arnes.mjs';

const { renderizarComProvedores } = await carregarArnes();
const { produtos: produtosMock } = await carregarModulo('src/mocks/produtos.ts', 'produtosMockParaPainel');
const { caso, secao, encerrar } = criarPlacar();

const ADMIN = { clienteId: 'cli-001', usuarioId: 'usr-001' }; // Renata, admin
const VENDEDOR = { clienteId: 'cli-001', usuarioId: 'usr-003' }; // Cláudia, vendedor
const EDITOR = { clienteId: 'cli-001', usuarioId: 'usr-002' }; // Gustavo, editor

const pagina = (rota, sessao = ADMIN) => renderizarComProvedores(rota, { sessao });

/* ============ 1. admin: vê tudo ============ */
secao('admin — números completos');
const painelAdmin = pagina('/admin', ADMIN);
caso('saudacao com o nome', painelAdmin.includes('Bem-vindo, Renata Coutinho.'));
caso('total de produtos (10 mocks)', /Total[\s\S]{0,80}?>\s*10\s*</.test(painelAdmin));
caso('esgotados (1 no mock)', /Esgotados[\s\S]{0,80}?>\s*1\s*</.test(painelAdmin));
caso('pedidos por status: entregue', /Entregue[\s\S]{0,80}?>\s*1\s*</.test(painelAdmin));
caso('pedidos por status: enviado', /Enviado[\s\S]{0,80}?>\s*1\s*</.test(painelAdmin));
caso('pedidos por status: pago (zero, mas aparece)', /(?<!não )Pago[\s\S]{0,80}?>\s*0\s*</.test(painelAdmin));
caso('receita dos pedidos pagos, em mono', painelAdmin.includes('R$ 518,00'));

/* ============ 2. editor: só produtos ============ */
secao('editor — só produtos');
const painelEditor = pagina('/admin', EDITOR);
caso('editor ve o grupo de produtos', painelEditor.includes('>Produtos<') && /Total[\s\S]{0,80}?>\s*10\s*</.test(painelEditor));
caso('editor NAO ve pedidos por status', !painelEditor.includes('Pedidos por status'));
caso('editor NAO ve receita', !painelEditor.includes('Receita'));

/* ============ 3. vendedor: produtos e pedidos ============ */
secao('vendedor — produtos e pedidos');
const painelVendedor = pagina('/admin', VENDEDOR);
caso('vendedor ve produtos', painelVendedor.includes('>Produtos<'));
caso('vendedor ve pedidos por status', painelVendedor.includes('Pedidos por status'));
caso('vendedor ve receita', painelVendedor.includes('Receita'));

/* ============ 4. tudo derivado, nada hardcoded — muda com o catálogo ============ */
secao('derivado do contexto, não hardcoded');
const produtosComMaisUmEsgotado = produtosMock.map((p, i) => (i === 1 ? { ...p, estoque: 0 } : p));
const painelComMaisEsgotado = renderizarComProvedores('/admin', { sessao: ADMIN, produtos: produtosComMaisUmEsgotado });
caso('esgotados reflete o catalogo vivo (2, nao mais 1)', /Esgotados[\s\S]{0,80}?>\s*2\s*</.test(painelComMaisEsgotado));

encerrar();
