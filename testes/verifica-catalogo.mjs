import { carregarModulo } from './arnes.mjs';

const c = await carregarModulo('src/lib/catalogo.ts', 'catalogo');
const { produtos } = await carregarModulo('src/mocks/produtos.ts', 'produtos');
const p = (id) => produtos.find((x) => x.id === id);
const filtros = (qs) => c.lerFiltrosDaUrl(new URLSearchParams(qs));
const aplicar = (qs) => c.filtrarProdutos(produtos, filtros(qs));
const slugs = (qs, ordem) => c.ordenarProdutos(produtos, ordem).map((x) => x.slug);

const casos = [
  // 1. Preço, estoque, promoção
  ['precoVigente prod-001', c.precoVigente(p('prod-001')), 15900],
  ['precoVigente prod-002', c.precoVigente(p('prod-002')), 21500],
  ['precoVigente prod-009', c.precoVigente(p('prod-009')), 44900],
  ['estaDisponivel prod-003 (null)', c.estaDisponivel(p('prod-003')), true],
  ['estaDisponivel prod-006 (3)', c.estaDisponivel(p('prod-006')), true],
  ['estaDisponivel prod-008 (0)', c.estaDisponivel(p('prod-008')), false],
  ['estoqueBaixo prod-006 (3)', c.estoqueBaixo(p('prod-006')), true],
  ['estoqueBaixo prod-002 (7)', c.estoqueBaixo(p('prod-002')), false],
  ['estoqueBaixo prod-008 (0)', c.estoqueBaixo(p('prod-008')), false],
  ['estoqueBaixo prod-003 (null)', c.estoqueBaixo(p('prod-003')), false],
  ['desconto prod-001', c.percentualDeDesconto(p('prod-001')), 16],
  ['desconto prod-005', c.percentualDeDesconto(p('prod-005')), 21],
  ['desconto prod-009', c.percentualDeDesconto(p('prod-009')), 18],
  ['desconto prod-002 (sem)', c.percentualDeDesconto(p('prod-002')), null],

  // 2. Normalização
  ['normalizar Matematica', c.normalizarTexto('Matem\u00e1tica'), 'matematica'],
  ['normalizar POS-QUANTICA', c.normalizarTexto('P\u00d3S-QU\u00c2NTICA'), 'pos-quantica'],
  ['normalizar Ana Lucia', c.normalizarTexto('  Ana L\u00facia '), 'ana lucia'],

  // 3. URL
  ['url vazia: busca', filtros('').busca, ''],
  ['url vazia: ordem', filtros('').ordenacao, 'relevancia'],
  ['url vazia: categorias', filtros('').categoriaIds.length, 0],
  ['?categoria=criptografia', JSON.stringify(filtros('?categoria=criptografia').categoriaIds), '["cat-cripto"]'],
  ['?categoria=inexistente', JSON.stringify(filtros('?categoria=inexistente').categoriaIds), '["inexistente"]'],
  ['?tipo=ebook&tipo=livro', JSON.stringify(filtros('?tipo=ebook&tipo=livro').tipos), '["ebook"]'],
  ['?ordem=xpto', filtros('?ordem=xpto').ordenacao, 'relevancia'],
  ['?ordem=menor_preco', filtros('?ordem=menor_preco').ordenacao, 'menor_preco'],
  ['?precoMin=50', filtros('?precoMin=50').precoMin, 5000],
  ['?precoMax=199,90', filtros('?precoMax=199,90').precoMax, 19990],
  ['?precoMin=-1', filtros('?precoMin=-1').precoMin, undefined],
  ['?precoMin=abc', filtros('?precoMin=abc').precoMin, undefined],
  ['?estoque=1', filtros('?estoque=1').somenteEmEstoque, true],

  ['precoEmReais(5000)', c.precoEmReais(5000), '50'],
  ['precoEmReais(19990)', c.precoEmReais(19990), '200'],
  ['precoEmReais(0)', c.precoEmReais(0), '0'],
  ['precoEmReais(undefined)', c.precoEmReais(undefined), ''],

  // 4. Contagem de filtros ativos
  ['ativos: nenhum', c.contarFiltrosAtivos(filtros('')), 0],
  ['ativos: ?busca=ia', c.contarFiltrosAtivos(filtros('?busca=ia')), 1],
  ['ativos: categoria+tipo', c.contarFiltrosAtivos(filtros('?categoria=criptografia&tipo=ebook')), 2],
  ['ativos: preco+estoque', c.contarFiltrosAtivos(filtros('?precoMin=50&precoMax=200&estoque=1')), 3],
  ['ativos: so ordem', c.contarFiltrosAtivos(filtros('?ordem=menor_preco')), 0],

  // 5. Filtragem
  ['sem filtro', aplicar('').length, 10],
  ['busca matematica', aplicar('?busca=matematica').length, 1],
  ['busca POS-QUANTICA', aplicar('?busca=POS-QUANTICA').length, 1],
  ['busca ana lucia (autor)', aplicar('?busca=ana%20lucia').length, 1],
  ['busca transformers (subtitulo)', aplicar('?busca=transformers').length, 1],
  ['tipo ebook', aplicar('?tipo=ebook').length, 4],
  ['tipo ebook+kit', aplicar('?tipo=ebook&tipo=kit').length, 5],
  ['categoria didaticos', aplicar('?categoria=didaticos').length, 4],
  ['somente em estoque', aplicar('?estoque=1').length, 9],
  ['precoMin 200', aplicar('?precoMin=200').length, 2],
  ['ebook + precoMax 50', aplicar('?tipo=ebook&precoMax=50').length, 1],
  ['categoria inexistente', aplicar('?categoria=inexistente').length, 0],

  // 6. Ordenação
  ['menor_preco', slugs('', 'menor_preco')[0], 'revista-compia-01-agentes'],
  ['maior_preco', slugs('', 'maior_preco')[0], 'kit-trilha-ia-aplicada'],
  ['lancamentos', slugs('', 'lancamentos')[0], 'seguranca-de-modelos-de-linguagem'],
  ['titulo_az', slugs('', 'titulo_az')[0], 'algoritmos-de-busca-e-planejamento'],
  ['relevancia', slugs('', 'relevancia')[0], 'seguranca-de-modelos-de-linguagem'],
  ['ordenar nao muta', (() => { const antes = produtos[0].slug; c.ordenarProdutos(produtos,'titulo_az'); return produtos[0].slug === antes; })(), true],

  // 7. Contagem por categoria
  ['cat-ia', c.contarPorCategoria(produtos)['cat-ia'], 8],
  ['cat-arq', c.contarPorCategoria(produtos)['cat-arq'], 4],
  ['cat-didaticos', c.contarPorCategoria(produtos)['cat-didaticos'], 4],
  ['cat-ciberseguranca', c.contarPorCategoria(produtos)['cat-ciberseguranca'], 2],
  ['cat-blockchain', c.contarPorCategoria(produtos)['cat-blockchain'], 1],
  ['cat-cripto', c.contarPorCategoria(produtos)['cat-cripto'], 1],
  ['lista vazia', c.contarPorCategoria([])['cat-ia'], undefined],
];

let falhas = 0;
for (const [nome, obtido, esperado] of casos) {
  const ok = Object.is(obtido, esperado);
  if (!ok) falhas++;
  console.log((ok ? 'ok    ' : 'FALHA ') + nome.padEnd(32) + ' => ' + JSON.stringify(obtido) + (ok ? '' : '   esperado ' + JSON.stringify(esperado)));
}
console.log('\n' + casos.length + ' casos, ' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
