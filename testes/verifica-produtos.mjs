import { carregarModulo, criarPlacar } from './arnes.mjs';

const lib = await carregarModulo('src/lib/produto.ts', 'produtoLibParaEstoque');
const arm = await carregarModulo('src/lib/produtosArmazenados.ts', 'produtosArmazenados');
const ctx = await carregarModulo('src/contexts/ProdutosContext.tsx', 'produtosContext');
const { produtos } = await carregarModulo('src/mocks/produtos.ts', 'produtosMockParaContexto');

const { conferir, secao, encerrar } = criarPlacar();

const p = (id) => produtos.find((x) => x.id === id);

/* ============ 1. baixarEstoque ============ */
secao('baixarEstoque');
const apos1 = lib.baixarEstoque(produtos, [{ produtoId: 'prod-002', quantidade: 3 }]);
conferir('reduz o estoque do item comprado', apos1.find((x) => x.id === 'prod-002').estoque, 4);
conferir('demais produtos intactos', apos1.find((x) => x.id === 'prod-001').estoque, p('prod-001').estoque);

conferir(
  'e-book (estoque null) nao muda',
  lib.baixarEstoque(produtos, [{ produtoId: 'prod-003', quantidade: 1 }]).find((x) => x.id === 'prod-003').estoque,
  null,
);
conferir(
  'e-book continua null mesmo com quantidade alta',
  lib.baixarEstoque(produtos, [{ produtoId: 'prod-005', quantidade: 50 }]).find((x) => x.id === 'prod-005').estoque,
  null,
);
conferir(
  'todos os e-books da lista permanecem com estoque null',
  lib.baixarEstoque(produtos, [{ produtoId: 'prod-003', quantidade: 1 }])
    .filter((x) => x.tipo === 'ebook')
    .every((x) => x.estoque === null),
  true,
);

conferir(
  'quantidade igual ao estoque zera exatamente, nao fica negativo',
  lib.baixarEstoque(produtos, [{ produtoId: 'prod-002', quantidade: 7 }]).find((x) => x.id === 'prod-002').estoque,
  0,
);
conferir(
  'quantidade acima do estoque tambem para em zero, nunca negativo',
  lib.baixarEstoque(produtos, [{ produtoId: 'prod-006', quantidade: 99 }]).find((x) => x.id === 'prod-006').estoque,
  0,
);
conferir(
  'produto ja esgotado (estoque 0) continua em zero, nao vira negativo',
  lib.baixarEstoque(produtos, [{ produtoId: 'prod-008', quantidade: 3 }]).find((x) => x.id === 'prod-008').estoque,
  0,
);
conferir(
  'nenhum produto no resultado fica com estoque negativo',
  lib
    .baixarEstoque(produtos, [
      { produtoId: 'prod-001', quantidade: 999 },
      { produtoId: 'prod-002', quantidade: 999 },
      { produtoId: 'prod-006', quantidade: 999 },
      { produtoId: 'prod-008', quantidade: 999 },
      { produtoId: 'prod-009', quantidade: 999 },
    ])
    .every((x) => x.estoque === null || x.estoque >= 0),
  true,
);

conferir('item fantasma e ignorado', lib.baixarEstoque(produtos, [{ produtoId: 'zzz', quantidade: 1 }]), produtos);
conferir('lista de itens vazia nao muda nada', lib.baixarEstoque(produtos, []), produtos);

const doisItens = lib.baixarEstoque(produtos, [
  { produtoId: 'prod-002', quantidade: 1 },
  { produtoId: 'prod-006', quantidade: 2 },
]);
conferir('baixa dois produtos na mesma chamada (1)', doisItens.find((x) => x.id === 'prod-002').estoque, 6);
conferir('baixa dois produtos na mesma chamada (2)', doisItens.find((x) => x.id === 'prod-006').estoque, 1);

const antesDaBaixa = JSON.parse(JSON.stringify(produtos));
lib.baixarEstoque(produtos, [{ produtoId: 'prod-002', quantidade: 5 }]);
conferir('nao muta o array nem os produtos recebidos', produtos, antesDaBaixa);

/* ============ 1b. devolverEstoque ============ */
secao('devolverEstoque');
conferir(
  'devolve ao estoque do item cancelado',
  lib.devolverEstoque(produtos, [{ produtoId: 'prod-002', quantidade: 3 }]).find((x) => x.id === 'prod-002').estoque,
  10,
);
conferir(
  'e-book (estoque null) nao muda ao devolver',
  lib.devolverEstoque(produtos, [{ produtoId: 'prod-003', quantidade: 1 }]).find((x) => x.id === 'prod-003').estoque,
  null,
);
conferir(
  'devolve a um produto esgotado, tirando do zero',
  lib.devolverEstoque(produtos, [{ produtoId: 'prod-008', quantidade: 2 }]).find((x) => x.id === 'prod-008').estoque,
  2,
);
conferir('item fantasma e ignorado', lib.devolverEstoque(produtos, [{ produtoId: 'zzz', quantidade: 1 }]), produtos);
conferir(
  'baixar e depois devolver a mesma quantidade volta ao estoque original',
  lib.devolverEstoque(lib.baixarEstoque(produtos, [{ produtoId: 'prod-006', quantidade: 2 }]), [
    { produtoId: 'prod-006', quantidade: 2 },
  ]).find((x) => x.id === 'prod-006').estoque,
  p('prod-006').estoque,
);

const antesDaDevolucao = JSON.parse(JSON.stringify(produtos));
lib.devolverEstoque(produtos, [{ produtoId: 'prod-002', quantidade: 5 }]);
conferir('devolverEstoque nao muta o array nem os produtos recebidos', produtos, antesDaDevolucao);

/* ============ 2. produtosArmazenados ============ */
secao('produtosArmazenados');
conferir('chave versionada', arm.CHAVE_PRODUTOS, 'compia:produtos:v1');
conferir('ida e volta preserva os 10', arm.desserializar(arm.serializar(produtos)).length, 10);
conferir('JSON corrompido nao lanca', arm.desserializar('{{{'), []);
conferir('string vazia', arm.desserializar(''), []);
conferir('objeto no lugar de array', arm.desserializar('{}'), []);
conferir('sem slug e descartado', arm.desserializar(JSON.stringify([{ ...p('prod-001'), slug: '' }])), []);
conferir('tipo inventado e descartado', arm.desserializar(JSON.stringify([{ ...p('prod-001'), tipo: 'xpto' }])), []);
conferir('estoque string e descartado', arm.desserializar(JSON.stringify([{ ...p('prod-001'), estoque: 'muitos' }])), []);
conferir(
  'estoque null (e-book) e mantido',
  arm.desserializar(JSON.stringify([p('prod-003')])).length,
  1,
);
conferir('array misto guarda so o valido', arm.desserializar(JSON.stringify([null, p('prod-001'), 'lixo'])).length, 1);

function armazenamentoFalso(inicial = {}) {
  const dados = { ...inicial };
  return { dados, getItem: (k) => (k in dados ? dados[k] : null), setItem: (k, v) => { dados[k] = String(v); }, removeItem: (k) => { delete dados[k]; } };
}

delete globalThis.localStorage;
conferir('sem localStorage: carregar da null', arm.carregar(), null);
conferir('sem localStorage: salvar nao lanca', (() => { try { arm.salvar(produtos); return 'nao lancou'; } catch { return 'LANCOU'; } })(), 'nao lancou');
conferir('sem localStorage: semeia com os mocks', arm.carregarProdutos(produtos).length, 10);

globalThis.localStorage = armazenamentoFalso();
conferir('nada gravado: semeia com os mocks', arm.carregarProdutos(produtos).length, 10);
arm.salvar([produtos[0]]);
conferir('gravado manda sobre a semente', arm.carregarProdutos(produtos).length, 1);
globalThis.localStorage = armazenamentoFalso({ 'compia:produtos:v1': '[]' });
conferir('gravado vazio e respeitado', arm.carregarProdutos(produtos), []);
globalThis.localStorage = armazenamentoFalso({ 'compia:produtos:v1': '{{{' });
conferir('gravado corrompido nao derruba', arm.carregarProdutos(produtos), []);
globalThis.localStorage = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('modo privado'); } };
conferir('getItem que lanca: cai na semente', arm.carregarProdutos(produtos).length, 10);
conferir('setItem que lanca nao propaga', (() => { try { arm.salvar(produtos); return 'nao lancou'; } catch { return 'LANCOU'; } })(), 'nao lancou');
delete globalThis.localStorage;

/* ============ 3. reducerProdutos ============ */
secao('reducerProdutos');
const estado = { produtos: [p('prod-001'), p('prod-002')] };

const novo = { ...p('prod-001'), id: 'prod-novo', slug: 'produto-novo', titulo: 'Produto Novo' };
const comNovo = ctx.reducerProdutos(estado, { tipo: 'salvar', produto: novo });
conferir('salvar um id novo acrescenta', comNovo.produtos.length, 3);
conferir('o novo entra na lista', comNovo.produtos[2].id, 'prod-novo');
conferir('nao muta o estado anterior', estado.produtos.length, 2);

const editado = { ...p('prod-001'), titulo: 'Titulo Editado' };
const comEdicao = ctx.reducerProdutos(estado, { tipo: 'salvar', produto: editado });
conferir('salvar um id existente substitui', comEdicao.produtos.length, 2);
conferir('mantem a posicao', comEdicao.produtos[0].titulo, 'Titulo Editado');
conferir('nao mexe nos demais', comEdicao.produtos[1].id, 'prod-002');

const semUm = ctx.reducerProdutos(estado, { tipo: 'excluir', produtoId: 'prod-001' });
conferir('excluir remove pelo id', semUm.produtos.map((x) => x.id), ['prod-002']);
conferir('excluir id inexistente e inocuo', ctx.reducerProdutos(estado, { tipo: 'excluir', produtoId: 'zzz' }).produtos.length, 2);

const comBaixa = ctx.reducerProdutos(estado, { tipo: 'baixarEstoque', itens: [{ produtoId: 'prod-002', quantidade: 2 }] });
conferir('baixarEstoque delega a lib/produto', comBaixa.produtos.find((x) => x.id === 'prod-002').estoque, p('prod-002').estoque - 2);
conferir('baixarEstoque nao mexe em quem nao foi comprado', comBaixa.produtos.find((x) => x.id === 'prod-001').estoque, p('prod-001').estoque);

const comDevolucao = ctx.reducerProdutos(estado, { tipo: 'devolverEstoque', itens: [{ produtoId: 'prod-002', quantidade: 2 }] });
conferir('devolverEstoque delega a lib/produto', comDevolucao.produtos.find((x) => x.id === 'prod-002').estoque, p('prod-002').estoque + 2);
conferir('devolverEstoque nao mexe em quem nao foi devolvido', comDevolucao.produtos.find((x) => x.id === 'prod-001').estoque, p('prod-001').estoque);

/* ============ 4. criarEstadoInicial ============ */
secao('criarEstadoInicial');
globalThis.localStorage = armazenamentoFalso();
conferir('sem nada gravado: os 10 mocks', ctx.criarEstadoInicial().produtos.length, 10);
globalThis.localStorage = armazenamentoFalso({ 'compia:produtos:v1': JSON.stringify([p('prod-002')]) });
conferir('gravado manda', ctx.criarEstadoInicial().produtos.map((x) => x.id), ['prod-002']);
globalThis.localStorage = armazenamentoFalso({ 'compia:produtos:v1': 'nao e json' });
conferir('corrompido nao derruba', ctx.criarEstadoInicial().produtos, []);
delete globalThis.localStorage;

encerrar();
