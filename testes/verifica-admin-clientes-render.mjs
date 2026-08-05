import { carregarArnes, criarPlacar } from './arnes.mjs';

const { renderizarComProvedores } = await carregarArnes();
const { caso, secao, encerrar } = criarPlacar();

const ADMIN = { clienteId: 'cli-001', usuarioId: 'usr-001' }; // Renata, admin
const VENDEDOR = { clienteId: 'cli-001', usuarioId: 'usr-003' }; // Cláudia, vendedor
const EDITOR = { clienteId: 'cli-001', usuarioId: 'usr-002' }; // Gustavo, editor

const pagina = (rota, sessao = ADMIN) => renderizarComProvedores(rota, { sessao });

/* ============ 1. conteúdo, tudo derivado ============ */
secao('conteúdo');
const lista = pagina('/admin/clientes');
caso('titulo da pagina', lista.includes('>Clientes<'));
caso('lista os tres clientes', lista.includes('Yasmim Oliveira') && lista.includes('Eduardo Sampaio') && lista.includes('Larissa Fontes'));
caso('e-mail e telefone', lista.includes('yasmim@exemplo.com') && lista.includes('(83) 99812-3344'));
caso('cpf mascarado, nao em claro', lista.includes('***.456.789-**') && !lista.includes('123.456.789-00'));
caso('cidade do endereco principal', lista.includes('Campina Grande, PB') && lista.includes('São Paulo, SP') && lista.includes('Salvador, BA'));

/* ============ 2. agregados derivados do PedidosContext ============ */
secao('agregados — quantidade de pedidos e total gasto');
// cli-001 (Yasmim): 2 pedidos no mock (ped-001 entregue, ped-004 cancelado) — só 1 pago (6900).
caso('yasmim: quantidade de pedidos = 2 (todos, inclusive cancelado)', /Yasmim Oliveira[\s\S]{0,400}?>\s*2\s*</.test(lista));
caso('yasmim: total gasto so conta o pago (R$ 69,00)', lista.includes('R$ 69,00'));
// cli-002 (Eduardo): 1 pedido enviado (pago), total 44900.
caso('eduardo: total gasto do pedido pago', lista.includes('R$ 449,00'));
// cli-003 (Larissa): 1 pedido aguardando_pagamento — total gasto 0, nao inclui o valor do pedido nao pago.
caso('larissa: pedido nao pago nao conta no total (sem R$ 327,36)', !lista.includes('R$ 327,36'));

/* ============ 3. linha clicável leva a /admin/pedidos filtrado ============ */
secao('linha clicável');
caso('link para pedidos do cliente cli-001', lista.includes('href="/admin/pedidos?cliente=cli-001"'));
caso('link para pedidos do cliente cli-002', lista.includes('href="/admin/pedidos?cliente=cli-002"'));
caso('link para pedidos do cliente cli-003', lista.includes('href="/admin/pedidos?cliente=cli-003"'));
caso('a linha inteira sinaliza clicavel (cursor-pointer), nao so o nome', (lista.match(/<tr class="[^"]*cursor-pointer/g) ?? []).length === 3);

/* ============ 4. somente leitura: sem formulário nenhum ============ */
secao('somente leitura');
caso('sem formulario de edicao', !lista.includes('<form'));
caso('sem botao de novo cliente ou editar', !lista.includes('Novo cliente') && !lista.includes('Editar'));
caso('sem botao de excluir', !lista.includes('Excluir'));

/* ============ 5. permissões: admin e vendedor veem, editor não ============ */
secao('permissões');
const vendedorEmClientes = pagina('/admin/clientes', VENDEDOR);
caso('vendedor acessa clientes', vendedorEmClientes.includes('<table'));

const editorEmClientes = pagina('/admin/clientes', EDITOR);
caso('editor barrado em clientes', editorEmClientes.includes('Você não tem acesso a esta área.'));
caso('mensagem diz o que o editor alcança', editorEmClientes.includes('Ele alcança: Produtos.'));

/* ============ 6. menu do painel mostra Clientes para quem tem acesso ============ */
secao('menu do painel');
const adminNoPainel = pagina('/admin', ADMIN);
caso('admin ve Clientes no menu', adminNoPainel.includes('>Clientes<'));
const vendedorNoPainel = pagina('/admin', VENDEDOR);
caso('vendedor ve Clientes no menu', vendedorNoPainel.includes('>Clientes<'));
const editorNoPainel = pagina('/admin', EDITOR);
caso('editor NAO ve Clientes no menu', !editorNoPainel.includes('>Clientes<'));

encerrar();
