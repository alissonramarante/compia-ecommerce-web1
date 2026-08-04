import { carregarModulo } from './arnes.mjs';

const lib = await carregarModulo('src/lib/produto.ts', 'produto');
const { produtos } = await carregarModulo('src/mocks/produtos.ts', 'produtos');
const { categorias } = await carregarModulo('src/mocks/categorias.ts', 'categorias');
const p = (id) => produtos.find((x) => x.id === id);
let falhas = 0;
const conferir = (nome, obtido, esperado) => {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log((ok ? 'ok    ' : 'FALHA ') + nome.padEnd(46) + JSON.stringify(obtido) + (ok ? '' : '  esperado ' + JSON.stringify(esperado)));
};

conferir('AUTOR_COLETIVO', lib.AUTOR_COLETIVO, 'V\u00e1rios autores');
conferir('AUTOR_COLETIVO bate com prod-007', p('prod-007').autores, [lib.AUTOR_COLETIVO]);
conferir('AUTOR_COLETIVO bate com prod-009', p('prod-009').autores, [lib.AUTOR_COLETIVO]);

conferir('buscarPorSlug kit', lib.buscarPorSlug(produtos, 'kit-trilha-ia-aplicada')?.id, 'prod-009');
conferir('buscarPorSlug inexistente', lib.buscarPorSlug(produtos, 'nao-existe'), undefined);
conferir('buscarPorSlug vazio', lib.buscarPorSlug(produtos, ''), undefined);

conferir('nomesDasCategorias 1', lib.nomesDasCategorias(categorias, ['cat-ia']).map((c) => c.nome), ['Intelig\u00eancia Artificial']);
conferir('nomesDasCategorias ordem', lib.nomesDasCategorias(categorias, ['cat-arq','cat-ia']).map((c) => c.nome), ['Arquitetura de Software','Intelig\u00eancia Artificial']);
conferir('nomesDasCategorias id ruim', lib.nomesDasCategorias(categorias, ['cat-xpto']), []);
conferir('nomesDasCategorias vazio', lib.nomesDasCategorias(categorias, []), []);

conferir('produtosDoKit', lib.produtosDoKit(produtos, p('prod-009')).map((x) => x.id), ['prod-001','prod-002','prod-008']);
conferir('produtosDoKit nao-kit', lib.produtosDoKit(produtos, p('prod-001')), []);

conferir('economiaDoKit prod-009', lib.economiaDoKit(produtos, p('prod-009')), { soma: 57300, economia: 12400, percentual: 22 });
conferir('economiaDoKit nao-kit', lib.economiaDoKit(produtos, p('prod-001')), { soma: 0, economia: 0, percentual: 0 });

const kitCaro = { ...p('prod-009'), preco: 60000, precoPromocional: undefined };
const kitNeutro = { ...p('prod-009'), preco: 57300, precoPromocional: undefined };
conferir('economiaDoKit kit caro (negativa)', lib.economiaDoKit(produtos, kitCaro), { soma: 57300, economia: -2700, percentual: -5 });
conferir('economiaDoKit kit neutro (zero)', lib.economiaDoKit(produtos, kitNeutro), { soma: 57300, economia: 0, percentual: 0 });

conferir('relacionados prod-001 (3)', lib.relacionados(produtos, p('prod-001'), 3).map((x) => x.id), ['prod-009','prod-010','prod-006']);
conferir('relacionados exclui o proprio', lib.relacionados(produtos, p('prod-001'), 99).some((x) => x.id === 'prod-001'), false);
conferir('relacionados prod-004 (unico)', lib.relacionados(produtos, p('prod-004'), 3), []);
conferir('relacionados limite 0', lib.relacionados(produtos, p('prod-001'), 0), []);

conferir('limitarQuantidade(3,42)', lib.limitarQuantidade(3, 42), 3);
conferir('limitarQuantidade(0,42)', lib.limitarQuantidade(0, 42), 1);
conferir('limitarQuantidade(-5,42)', lib.limitarQuantidade(-5, 42), 1);
conferir('limitarQuantidade(50,42)', lib.limitarQuantidade(50, 42), 42);
conferir('limitarQuantidade(50,null)', lib.limitarQuantidade(50, null), 50);
conferir('limitarQuantidade(2.7,null)', lib.limitarQuantidade(2.7, null), 2);
conferir('limitarQuantidade(NaN,null)', lib.limitarQuantidade(NaN, null), 1);

console.log('\n' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
