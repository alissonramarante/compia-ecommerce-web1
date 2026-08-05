import { carregarArnes } from './arnes.mjs';
const { renderizarComProvedores } = await carregarArnes();

let falhas = 0;
const caso = (nome, ok) => {
  if (!ok) falhas++;
  console.log((ok ? 'ok    ' : 'FALHA ') + nome);
};
const secao = (titulo) => console.log('\n--- ' + titulo + ' ---');

const admin = (rota, sessao) => renderizarComProvedores(rota, { sessao });

/* ============ 1. sem usuarioCorrente: acesso pedido, sem redirect silencioso ============ */
secao('sem equipe logada');
const semEquipe = admin('/admin', { clienteId: 'cli-001', usuarioId: null });
caso('mostra a tela de acesso restrito', semEquipe.includes('Acesso restrito à equipe.'));
caso('explica que a área é da equipe', semEquipe.includes('faz parte da equipe da editora'));
caso('oferece link para /entrar', semEquipe.includes('href="/entrar"'));
caso('nao mostra o layout do painel', !semEquipe.includes('Visão geral'));
caso('nao mostra conteudo da pagina protegida', !semEquipe.includes('Admin'));

const semEquipeProdutos = admin('/admin/produtos', { clienteId: 'cli-001', usuarioId: null });
caso('rota interna tambem pede acesso, nao só /admin', semEquipeProdutos.includes('Acesso restrito à equipe.'));

const semSessaoNenhuma = admin('/admin/logs', null);
caso('sem sessao gravada tambem pede acesso (nao ha usuario por padrao)', semSessaoNenhuma.includes('Acesso restrito à equipe.'));

/* ============ 2. logado, mas perfil sem alcance para a área ============ */
secao('perfil sem permissao para a area');
const editorEmPedidos = admin('/admin/pedidos', { clienteId: 'cli-001', usuarioId: 'usr-002' }); // Gustavo, editor
caso('editor em pedidos: mensagem de acesso negado', editorEmPedidos.includes('Você não tem acesso a esta área.'));
caso('editor em pedidos: diz o perfil em uso', editorEmPedidos.includes('editor'));
caso('editor em pedidos: diz o que ele alcança', editorEmPedidos.includes('Ele alcança: Produtos.'));
caso('editor em pedidos: nao renderiza o conteudo da area', !editorEmPedidos.includes('<table'));
caso('editor em pedidos: layout do painel continua visivel', editorEmPedidos.includes('Visão geral'));

const editorEmLogs = admin('/admin/logs', { clienteId: 'cli-001', usuarioId: 'usr-002' });
caso('editor em logs: tambem barrado', editorEmLogs.includes('Você não tem acesso a esta área.'));

const vendedorEmLogs = admin('/admin/logs', { clienteId: 'cli-001', usuarioId: 'usr-003' }); // Cláudia, vendedor
caso('vendedor em logs: barrado', vendedorEmLogs.includes('Você não tem acesso a esta área.'));
caso('vendedor em logs: diz as tres areas que alcança', vendedorEmLogs.includes('Ele alcança: Produtos, Pedidos, Clientes.'));

const vendedorEmProdutos = admin('/admin/produtos', { clienteId: 'cli-001', usuarioId: 'usr-003' });
caso('vendedor em produtos: acesso permitido (leitura)', vendedorEmProdutos.includes('<table'));
caso('vendedor em produtos: sem botão de novo produto', !vendedorEmProdutos.includes('Novo produto'));

const vendedorEmProdutoNovo = admin('/admin/produtos/novo', { clienteId: 'cli-001', usuarioId: 'usr-003' });
caso('vendedor em /produtos/novo: barrado (só leitura)', vendedorEmProdutoNovo.includes('Este perfil só tem leitura aqui.'));
caso('vendedor em /produtos/novo: nao renderiza o formulario', !vendedorEmProdutoNovo.includes('<form'));

/* ============ 3. admin: acesso total ============ */
secao('admin: acesso total');
const adminEmProdutos = admin('/admin/produtos', { clienteId: 'cli-001', usuarioId: 'usr-001' }); // Renata, admin
caso('admin acessa produtos', adminEmProdutos.includes('<table'));
caso('admin em produtos: ve o botao de novo produto', adminEmProdutos.includes('Novo produto'));

const adminEmProdutoNovo = admin('/admin/produtos/novo', { clienteId: 'cli-001', usuarioId: 'usr-001' });
caso('admin acessa /produtos/novo', adminEmProdutoNovo.includes('<form'));
const adminEmPedidos = admin('/admin/pedidos', { clienteId: 'cli-001', usuarioId: 'usr-001' });
caso('admin acessa pedidos', adminEmPedidos.includes('<table'));
const adminEmLogs = admin('/admin/logs', { clienteId: 'cli-001', usuarioId: 'usr-001' });
caso('admin acessa logs', adminEmLogs.includes('<table'));
const adminNoPainel = admin('/admin', { clienteId: 'cli-001', usuarioId: 'usr-001' });
caso('admin acessa o painel', adminNoPainel.includes('Bem-vindo, Renata Coutinho.'));

/* ============ 4. menu esconde, mas nao substitui a protecao ============ */
secao('menu do painel por perfil');
caso('admin ve as tres areas no menu', adminNoPainel.includes('>Produtos<') && adminNoPainel.includes('>Pedidos<') && adminNoPainel.includes('>Logs<'));

const editorNoPainel = admin('/admin', { clienteId: 'cli-001', usuarioId: 'usr-002' });
caso('editor so ve Produtos no menu', editorNoPainel.includes('>Produtos<'));
caso('editor nao ve Pedidos no menu', !editorNoPainel.includes('>Pedidos<'));
caso('editor nao ve Logs no menu', !editorNoPainel.includes('>Logs<'));

const vendedorNoPainel = admin('/admin', { clienteId: 'cli-001', usuarioId: 'usr-003' });
caso('vendedor ve Produtos e Pedidos no menu', vendedorNoPainel.includes('>Produtos<') && vendedorNoPainel.includes('>Pedidos<'));
caso('vendedor nao ve Logs no menu', !vendedorNoPainel.includes('>Logs<'));

/* Mesmo escondido do menu, a rota direta continua protegida — é o ponto
   central da tarefa: "esconder não é proteger". */
caso('vendedor digitando /admin/logs direto ainda e barrado', vendedorEmLogs.includes('Você não tem acesso a esta área.'));

/* ============ 5. identidade do painel: nome, perfil, sair ============ */
secao('identidade e saida');
caso('mostra o nome de quem esta logado', adminNoPainel.includes('Renata Coutinho'));
caso('mostra o perfil em mono', /font-mono[^"]*"[^>]*>\s*admin\s*</.test(adminNoPainel) || adminNoPainel.includes('>admin<'));
caso('oferece sair', adminNoPainel.includes('>Sair<'));
caso('oferece link de volta a loja', adminNoPainel.includes('Voltar à loja'));

/* ============ 6. usuario inativo salvo na sessao nao usa o painel ============ */
secao('usuario inativo');
const inativo = admin('/admin', { clienteId: 'cli-001', usuarioId: 'usr-004' }); // Otávio, inativo
caso('sessao com usuario inativo cai para "sem equipe logada"', inativo.includes('Acesso restrito à equipe.'));

console.log('\n' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
