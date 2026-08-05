import { carregarModulo } from './arnes.mjs';

const c = await carregarModulo('src/lib/carrinho.ts', 'carrinho');
const a = await carregarModulo('src/lib/carrinhoArmazenado.ts', 'carrinhoArmazenado');
const ctx = await carregarModulo('src/contexts/CarrinhoContext.tsx', 'carrinhoContext');
const { produtos } = await carregarModulo('src/mocks/produtos.ts', 'produtos');
const p = (id) => produtos.find((x) => x.id === id);

let falhas = 0;
const conferir = (nome, obtido, esperado) => {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log((ok ? 'ok    ' : 'FALHA ') + nome.padEnd(50) + JSON.stringify(obtido) + (ok ? '' : '  esperado ' + JSON.stringify(esperado)));
};
const secao = (titulo) => console.log('\n--- ' + titulo + ' ---');

/* ================= 1. quantidadeMaxima ================= */
secao('quantidadeMaxima');
conferir('prod-006 estoque 3', c.quantidadeMaxima(p('prod-006')), 3);
conferir('prod-001 estoque 42', c.quantidadeMaxima(p('prod-001')), 42);
conferir('prod-008 estoque 0', c.quantidadeMaxima(p('prod-008')), 0);
conferir('prod-005 e-book', c.quantidadeMaxima(p('prod-005')), 1);
conferir('prod-003 e-book', c.quantidadeMaxima(p('prod-003')), 1);
conferir('prod-009 kit estoque 12', c.quantidadeMaxima(p('prod-009')), 12);
conferir('nao-ebook sem estoque usa o teto', c.quantidadeMaxima({ ...p('prod-001'), estoque: null }), c.TETO_SEM_ESTOQUE);

/* ================= 2. adicionarItem ================= */
secao('adicionarItem');
const um = c.adicionarItem([], p('prod-001'), 1);
conferir('carrinho vazio + prod-001 x1', um, [{ produtoId: 'prod-001', quantidade: 1, precoUnitario: 15900 }]);
conferir('congela o preco vigente, nao o cheio', um[0].precoUnitario, 15900);
conferir('duas adicoes somam na mesma linha', c.adicionarItem(um, p('prod-001'), 1), [{ produtoId: 'prod-001', quantidade: 2, precoUnitario: 15900 }]);
conferir('nao duplica linha', c.adicionarItem(um, p('prod-001'), 1).length, 1);
conferir('prod-006 x5 limita a 3', c.adicionarItem([], p('prod-006'), 5)[0].quantidade, 3);
conferir('prod-006 x2 + x2 limita a 3', c.adicionarItem(c.adicionarItem([], p('prod-006'), 2), p('prod-006'), 2)[0].quantidade, 3);
conferir('e-book x3 continua 1', c.adicionarItem([], p('prod-005'), 3)[0].quantidade, 1);
conferir('e-book adicionado duas vezes continua 1', c.adicionarItem(c.adicionarItem([], p('prod-005'), 1), p('prod-005'), 1)[0].quantidade, 1);
conferir('esgotado nao entra', c.adicionarItem([], p('prod-008'), 1), []);
conferir('esgotado nao mexe no que ja existe', c.adicionarItem(um, p('prod-008'), 1), um);
conferir('quantidade 0 vira 1', c.adicionarItem([], p('prod-001'), 0)[0].quantidade, 1);
conferir('quantidade negativa vira 1', c.adicionarItem([], p('prod-001'), -3)[0].quantidade, 1);
conferir('nao muta a lista recebida', (() => { const base = c.adicionarItem([], p('prod-001'), 1); c.adicionarItem(base, p('prod-002'), 1); return base.length; })(), 1);

/* ================= 3. removerItem / alterarQuantidade ================= */
secao('removerItem e alterarQuantidade');
const dois = c.adicionarItem(c.adicionarItem([], p('prod-001'), 2), p('prod-007'), 1);
conferir('remove a linha certa', c.removerItem(dois, 'prod-001').map((i) => i.produtoId), ['prod-007']);
conferir('remover ausente nao muda nada', c.removerItem(dois, 'prod-999').length, 2);
conferir('alterar para 3', c.alterarQuantidade(dois, 'prod-001', 3)[0].quantidade, 3);
conferir('alterar para 0 remove', c.alterarQuantidade(dois, 'prod-001', 0).map((i) => i.produtoId), ['prod-007']);
conferir('alterar para -2 remove', c.alterarQuantidade(dois, 'prod-001', -2).map((i) => i.produtoId), ['prod-007']);
conferir('alterar para 2.7 trunca', c.alterarQuantidade(dois, 'prod-001', 2.7)[0].quantidade, 2);
conferir('alterar produto ausente', c.alterarQuantidade(dois, 'prod-999', 5).map((i) => i.quantidade), [2, 1]);

/* ================= 4. totais ================= */
secao('totais');
conferir('subtotal vazio', c.calcularSubtotal([]), 0);
conferir('subtotal prod-001 x2', c.calcularSubtotal(c.adicionarItem([], p('prod-001'), 2)), 31800);
conferir('subtotal misto', c.calcularSubtotal(dois), 35700);
conferir('totalDaLinha', c.totalDaLinha({ produtoId: 'x', quantidade: 3, precoUnitario: 1000 }), 3000);
conferir('contarItens vazio', c.contarItens([]), 0);
conferir('contarItens soma quantidades', c.contarItens(dois), 3);
conferir('pesoTotal vazio', c.pesoTotal([], produtos), 0);
conferir('pesoTotal prod-001 x2', c.pesoTotal(c.adicionarItem([], p('prod-001'), 2), produtos), 1960);
conferir('pesoTotal ignora e-book', c.pesoTotal(dois, produtos), 1960);
conferir('pesoTotal so e-book', c.pesoTotal(c.adicionarItem([], p('prod-005'), 1), produtos), 0);
conferir('pesoTotal com fantasma', c.pesoTotal([{ produtoId: 'fantasma', quantidade: 3, precoUnitario: 100 }], produtos), 0);

/* ================= 5. juncao e texto ================= */
secao('linhasDoCarrinho e mensagemDeAdicao');
conferir('linha casa com o produto', c.linhasDoCarrinho(um, produtos).map((l) => l.produto.id), ['prod-001']);
conferir('linha orfa e descartada', c.linhasDoCarrinho([{ produtoId: 'fantasma', quantidade: 1, precoUnitario: 1 }], produtos), []);
conferir('mensagem no singular', c.mensagemDeAdicao('Matem\u00e1tica Essencial para IA', 1), 'Matem\u00e1tica Essencial para IA adicionado ao carrinho. 1 item.');
conferir('mensagem no plural', c.mensagemDeAdicao('Kit Trilha de IA Aplicada', 3), 'Kit Trilha de IA Aplicada adicionado ao carrinho. 3 itens.');

/* ================= 6. serializacao ================= */
secao('desserializar (conteudo nao confiavel)');
conferir('array vazio', a.desserializar('[]'), []);
conferir('JSON corrompido nao lanca', a.desserializar('{{{'), []);
conferir('string vazia', a.desserializar(''), []);
conferir('null', a.desserializar('null'), []);
conferir('objeto no lugar de array', a.desserializar('{"produtoId":"prod-001"}'), []);
conferir('numero', a.desserializar('42'), []);
conferir('entrada valida', a.desserializar('[{"produtoId":"prod-001","quantidade":2,"precoUnitario":15900}]'), [{ produtoId: 'prod-001', quantidade: 2, precoUnitario: 15900 }]);
conferir('quantidade 0 descartada', a.desserializar('[{"produtoId":"p","quantidade":0,"precoUnitario":100}]'), []);
conferir('quantidade string descartada', a.desserializar('[{"produtoId":"p","quantidade":"2","precoUnitario":100}]'), []);
conferir('quantidade fracionaria descartada', a.desserializar('[{"produtoId":"p","quantidade":1.5,"precoUnitario":100}]'), []);
conferir('sem precoUnitario descartada', a.desserializar('[{"produtoId":"p","quantidade":1}]'), []);
conferir('preco negativo descartado', a.desserializar('[{"produtoId":"p","quantidade":1,"precoUnitario":-5}]'), []);
conferir('produtoId vazio descartado', a.desserializar('[{"produtoId":"","quantidade":1,"precoUnitario":100}]'), []);
conferir('null dentro do array', a.desserializar('[null]'), []);
conferir('array misto guarda so a valida', a.desserializar('[null,{"produtoId":"p","quantidade":1,"precoUnitario":100},"lixo"]'), [{ produtoId: 'p', quantidade: 1, precoUnitario: 100 }]);
conferir('campos extras sao ignorados', a.desserializar('[{"produtoId":"p","quantidade":1,"precoUnitario":100,"xpto":true}]'), [{ produtoId: 'p', quantidade: 1, precoUnitario: 100 }]);
conferir('ida e volta', a.desserializar(a.serializar(dois)), dois);
conferir('chave por cliente', a.chaveDoCarrinho('cli-001'), 'compia:carrinho:v1:cli-001');
conferir('chave antiga preservada como legado', a.CHAVE_CARRINHO_ANTIGA, 'compia:carrinho:v1');

/* ================= 7. acesso ao armazenamento ================= */
secao('carregar e salvar (localStorage hostil)');
const semArmazenamento = (() => { const antes = globalThis.localStorage; delete globalThis.localStorage; const r = [a.carregar('cli-001'), (() => { try { a.salvar('cli-001', dois); return 'nao lancou'; } catch { return 'LANCOU'; } })()]; if (antes !== undefined) globalThis.localStorage = antes; return r; })();
conferir('sem localStorage: carregar da []', semArmazenamento[0], []);
conferir('sem localStorage: salvar nao lanca', semArmazenamento[1], 'nao lancou');

function armazenamentoFalso(inicial = {}) {
  const dados = { ...inicial };
  return { dados, getItem: (k) => (k in dados ? dados[k] : null), setItem: (k, v) => { dados[k] = String(v); }, removeItem: (k) => { delete dados[k]; } };
}
globalThis.localStorage = armazenamentoFalso();
a.salvar('cli-001', dois);
conferir('salvar grava na chave do cliente', a.desserializar(globalThis.localStorage.dados['compia:carrinho:v1:cli-001']), dois);
conferir('carregar le de volta', a.carregar('cli-001'), dois);
globalThis.localStorage = armazenamentoFalso({ 'compia:carrinho:v1:cli-001': '{{{lixo' });
conferir('conteudo corrompido no storage da []', a.carregar('cli-001'), []);
globalThis.localStorage = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('modo privado'); } };
conferir('getItem que lanca da []', a.carregar('cli-001'), []);
conferir('setItem que lanca nao propaga', (() => { try { a.salvar('cli-001', dois); return 'nao lancou'; } catch { return 'LANCOU'; } })(), 'nao lancou');
delete globalThis.localStorage;

/* ================= 8. reconciliacao ================= */
secao('reconciliar');
const coerente = [{ produtoId: 'prod-001', quantidade: 2, precoUnitario: 15900 }];
conferir('carrinho coerente: itens intactos', a.reconciliar(coerente, produtos).itens, coerente);
conferir('carrinho coerente: sem avisos', a.reconciliar(coerente, produtos).avisos.length, 0);

const fantasma = a.reconciliar([{ produtoId: 'prod-999', quantidade: 1, precoUnitario: 100 }], produtos);
conferir('item fantasma removido', fantasma.itens, []);
conferir('item fantasma avisa', fantasma.avisos, ['Um t\u00edtulo que estava no carrinho saiu do cat\u00e1logo e foi removido.']);

const esgotado = a.reconciliar([{ produtoId: 'prod-008', quantidade: 1, precoUnitario: 19900 }], produtos);
conferir('esgotado removido', esgotado.itens, []);
conferir('esgotado avisa com o titulo', esgotado.avisos, ['Engenharia de Dados para IA est\u00e1 esgotado e saiu do carrinho.']);

const demais = a.reconciliar([{ produtoId: 'prod-006', quantidade: 9, precoUnitario: 14200 }], produtos);
conferir('quantidade reduzida ao estoque', demais.itens[0].quantidade, 3);
conferir('reducao avisa com os dois numeros', demais.avisos, ['Algoritmos de Busca e Planejamento teve a quantidade reduzida de 9 para 3, o estoque dispon\u00edvel.']);

const precoVelho = a.reconciliar([{ produtoId: 'prod-001', quantidade: 1, precoUnitario: 18900 }], produtos);
conferir('preco atualizado para o vigente', precoVelho.itens[0].precoUnitario, 15900);
conferir('mudanca de preco avisa de quanto para quanto', precoVelho.avisos, ['Fundamentos de Aprendizado Profundo mudou de R$ 189,00 para R$ 159,00.']);

const ebookDemais = a.reconciliar([{ produtoId: 'prod-005', quantidade: 4, precoUnitario: 6900 }], produtos);
conferir('e-book reduzido a 1', ebookDemais.itens[0].quantidade, 1);
conferir('e-book tem aviso proprio', ebookDemais.avisos, ['Seguran\u00e7a de Modelos de Linguagem \u00e9 e-book e vale por uma unidade: quantidade ajustada para 1.']);

const doisProblemas = a.reconciliar([{ produtoId: 'prod-006', quantidade: 9, precoUnitario: 99900 }], produtos);
conferir('quantidade e preco: dois avisos', doisProblemas.avisos.length, 2);
conferir('quantidade e preco: linha corrigida', doisProblemas.itens[0], { produtoId: 'prod-006', quantidade: 3, precoUnitario: 14200 });

conferir('reconciliar nao muta a entrada', (() => { const entrada = [{ produtoId: 'prod-001', quantidade: 1, precoUnitario: 18900 }]; a.reconciliar(entrada, produtos); return entrada[0].precoUnitario; })(), 18900);

/* ================= 9. reducer (puro) ================= */
secao('reducerCarrinho');
const vazio = { itens: [], avisos: [] };
conferir('adicionar', ctx.reducerCarrinho(vazio, { tipo: 'adicionar', produto: p('prod-001'), quantidade: 1 }).itens.length, 1);
const comDois = ctx.reducerCarrinho(ctx.reducerCarrinho(vazio, { tipo: 'adicionar', produto: p('prod-001'), quantidade: 1 }), { tipo: 'adicionar', produto: p('prod-001'), quantidade: 1 });
conferir('adicionar duas vezes soma', comDois.itens[0].quantidade, 2);
const comEbook = ctx.reducerCarrinho(ctx.reducerCarrinho(vazio, { tipo: 'adicionar', produto: p('prod-005'), quantidade: 1 }), { tipo: 'adicionar', produto: p('prod-005'), quantidade: 1 });
conferir('e-book duas vezes continua 1', comEbook.itens[0].quantidade, 1);
conferir('esgotado nao entra pelo reducer', ctx.reducerCarrinho(vazio, { tipo: 'adicionar', produto: p('prod-008'), quantidade: 1 }).itens, []);

const comEstoque3 = ctx.reducerCarrinho(vazio, { tipo: 'adicionar', produto: p('prod-006'), quantidade: 1 });
conferir('alterar acima do estoque e limitado', ctx.reducerCarrinho(comEstoque3, { tipo: 'alterar', produto: p('prod-006'), quantidade: 99 }).itens[0].quantidade, 3);
conferir('alterar e-book acima de 1 e limitado', ctx.reducerCarrinho(comEbook, { tipo: 'alterar', produto: p('prod-005'), quantidade: 7 }).itens[0].quantidade, 1);
conferir('alterar para 0 remove', ctx.reducerCarrinho(comEstoque3, { tipo: 'alterar', produto: p('prod-006'), quantidade: 0 }).itens, []);
conferir('remover', ctx.reducerCarrinho(comDois, { tipo: 'remover', produtoId: 'prod-001' }).itens, []);
conferir('limpar', ctx.reducerCarrinho(comDois, { tipo: 'limpar' }).itens, []);

const comAvisos = { itens: [], avisos: [{ id: 'aviso-0', texto: 'a' }, { id: 'aviso-1', texto: 'b' }] };
conferir('descartarAviso tira so o pedido', ctx.reducerCarrinho(comAvisos, { tipo: 'descartarAviso', id: 'aviso-0' }).avisos.map((x) => x.id), ['aviso-1']);
conferir('descartarAviso preserva os itens', ctx.reducerCarrinho({ ...comAvisos, itens: comDois.itens }, { tipo: 'descartarAviso', id: 'aviso-0' }).itens.length, 1);
conferir('reducer nao muta o estado recebido', (() => { const base = { itens: comDois.itens, avisos: [] }; ctx.reducerCarrinho(base, { tipo: 'limpar' }); return base.itens.length; })(), 1);

/* ================= 10. carga inicial ================= */
secao('criarEstadoInicial');
globalThis.localStorage = armazenamentoFalso({
  'compia:carrinho:v1:cli-001': JSON.stringify([
    { produtoId: 'prod-001', quantidade: 1, precoUnitario: 18900 },
    { produtoId: 'prod-999', quantidade: 1, precoUnitario: 100 },
    { produtoId: 'prod-006', quantidade: 9, precoUnitario: 14200 },
  ]),
});
const inicial = ctx.criarEstadoInicial('cli-001', produtos);
conferir('carga inicial reconcilia os itens', inicial.itens, [
  { produtoId: 'prod-001', quantidade: 1, precoUnitario: 15900 },
  { produtoId: 'prod-006', quantidade: 3, precoUnitario: 14200 },
]);
conferir('carga inicial produz 3 avisos', inicial.avisos.length, 3);
conferir('avisos recebem id estavel', inicial.avisos.map((x) => x.id), ['aviso-0', 'aviso-1', 'aviso-2']);
globalThis.localStorage = armazenamentoFalso({ 'compia:carrinho:v1:cli-001': 'nao e json' });
conferir('storage corrompido: estado vazio, sem aviso', ctx.criarEstadoInicial('cli-001', produtos), { clienteId: 'cli-001', itens: [], avisos: [], sequenciaDeAvisos: 0 });
delete globalThis.localStorage;

/* ================= 11. carrinho por cliente ================= */
secao('carrinho por cliente');
const carrinhoA = [{ produtoId: 'prod-001', quantidade: 2, precoUnitario: 15900 }];
const carrinhoB = [{ produtoId: 'prod-007', quantidade: 1, precoUnitario: 3900 }];
globalThis.localStorage = armazenamentoFalso();
a.salvar('cli-001', carrinhoA);
a.salvar('cli-002', carrinhoB);
conferir('cada cliente tem sua chave', Object.keys(globalThis.localStorage.dados).sort(), ['compia:carrinho:v1:cli-001', 'compia:carrinho:v1:cli-002']);
conferir('cli-001 le o proprio carrinho', a.carregar('cli-001'), carrinhoA);
conferir('cli-002 le o proprio carrinho', a.carregar('cli-002'), carrinhoB);
conferir('os dois nao se misturam', a.carregar('cli-001')[0].produtoId !== a.carregar('cli-002')[0].produtoId, true);
conferir('cliente sem carrinho comeca vazio', a.carregar('cli-003'), []);
a.salvar('cli-001', []);
conferir('esvaziar um nao afeta o outro', a.carregar('cli-002'), carrinhoB);

/* ================= 12. migracao da chave antiga ================= */
secao('migracao da chave sem sufixo');
globalThis.localStorage = armazenamentoFalso({ 'compia:carrinho:v1': JSON.stringify(carrinhoA) });
conferir('conteudo antigo e adotado', a.carregar('cli-001'), carrinhoA);
conferir('chave antiga e removida', globalThis.localStorage.dados['compia:carrinho:v1'], undefined);
conferir('conteudo foi para a chave do cliente', a.desserializar(globalThis.localStorage.dados['compia:carrinho:v1:cli-001']), carrinhoA);
globalThis.localStorage.dados['compia:carrinho:v1:cli-001'] = JSON.stringify(carrinhoB);
conferir('migracao nao roda de novo', a.carregar('cli-001'), carrinhoB);
globalThis.localStorage = armazenamentoFalso({ 'compia:carrinho:v1': JSON.stringify(carrinhoA), 'compia:carrinho:v1:cli-001': JSON.stringify(carrinhoB) });
conferir('nao sobrescreve carrinho ja existente', a.carregar('cli-001'), carrinhoB);
conferir('mas limpa a chave antiga', globalThis.localStorage.dados['compia:carrinho:v1'], undefined);
globalThis.localStorage = armazenamentoFalso({ 'compia:carrinho:v1': JSON.stringify(carrinhoA) });
conferir('migracao adota para quem esta logado', a.carregar('cli-003'), carrinhoA);
conferir('e nao vaza para os demais', a.carregar('cli-001'), []);
delete globalThis.localStorage;

/* ================= 13. reducer: trocarCliente ================= */
secao('reducer trocarCliente');
const estadoDeUm = { clienteId: 'cli-001', itens: carrinhoA, avisos: [{ id: 'aviso-0', texto: 'x' }] };
const trocado = ctx.reducerCarrinho(estadoDeUm, { tipo: 'trocarCliente', clienteId: 'cli-002', itens: carrinhoB, avisos: [] });
conferir('troca o dono', trocado.clienteId, 'cli-002');
conferir('troca os itens', trocado.itens, carrinhoB);
conferir('descarta avisos do anterior', trocado.avisos, []);
conferir('nao muta o estado anterior', estadoDeUm.clienteId, 'cli-001');
conferir('demais acoes preservam o dono', ctx.reducerCarrinho(estadoDeUm, { tipo: 'limpar' }).clienteId, 'cli-001');

/* ================= 14. canal de aviso (checkout abortado) ================= */
secao('reducer avisar');
const semAvisos = { clienteId: 'cli-001', itens: [], avisos: [], sequenciaDeAvisos: 0 };
const comUmAviso = ctx.reducerCarrinho(semAvisos, { tipo: 'avisar', texto: 'primeiro' });
conferir('avisar empilha o texto', comUmAviso.avisos, [{ id: 'aviso-0', texto: 'primeiro' }]);
conferir('avisar avanca a sequencia', comUmAviso.sequenciaDeAvisos, 1);
const comDoisAvisos = ctx.reducerCarrinho(comUmAviso, { tipo: 'avisar', texto: 'segundo' });
conferir('ids nao se repetem', comDoisAvisos.avisos.map((a) => a.id), ['aviso-0', 'aviso-1']);
/* Descartar e avisar de novo não pode reciclar id: o React usaria a mesma
   chave para conteúdos diferentes. */
const apos = ctx.reducerCarrinho(comDoisAvisos, { tipo: 'descartarAviso', id: 'aviso-0' });
conferir('id nao e reciclado apos descarte', ctx.reducerCarrinho(apos, { tipo: 'avisar', texto: 'terceiro' }).avisos.map((a) => a.id), ['aviso-1', 'aviso-2']);
conferir('avisar preserva os itens', ctx.reducerCarrinho({ ...semAvisos, itens: carrinhoA }, { tipo: 'avisar', texto: 'x' }).itens, carrinhoA);
conferir('avisar nao muta o estado anterior', semAvisos.avisos.length, 0);
conferir('trocarCliente zera a sequencia pelos avisos novos', ctx.reducerCarrinho(comDoisAvisos, { tipo: 'trocarCliente', clienteId: 'cli-002', itens: [], avisos: [{ id: 'aviso-0', texto: 'a' }] }).sequenciaDeAvisos, 1);

console.log('\n' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
