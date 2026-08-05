import { carregarArnes, carregarModulo, idsSaoUnicos } from './arnes.mjs';
const { renderizarComProvedores } = await carregarArnes();
const { produtos: produtosMock } = await carregarModulo('src/mocks/produtos.ts', 'produtosMockParaCarrinhoRender');

function comArmazenamento(itens) {
  return renderizarComProvedores('/carrinho', {
    comLayout: true,
    carrinhos: itens === null ? {} : { 'cli-001': itens },
  });
}

let falhas = 0;
const caso = (nome, ok) => {
  if (!ok) falhas++;
  console.log((ok ? 'ok    ' : 'FALHA ') + nome);
};

/* --- carrinho vazio --- */
const vazio = comArmazenamento(null);
caso('vazio: mensagem convidativa', vazio.includes('Seu carrinho está vazio.'));
caso('vazio: link para o catálogo', vazio.includes('Ver catálogo'));
caso('vazio: sem tabela', !vazio.includes('<table'));
caso('vazio: sem resumo zerado', !vazio.includes('>Resumo<'));
caso('vazio: cabeçalho sem o número 0', !/>0<\/span>/.test(vazio));
caso('vazio: aria-label do carrinho diz 0 itens', vazio.includes('aria-label="Carrinho, 0 itens"'));

/* --- carrinho com físico + e-book --- */
const cheio = comArmazenamento([
  { produtoId: 'prod-001', quantidade: 2, precoUnitario: 15900 },
  { produtoId: 'prod-005', quantidade: 1, precoUnitario: 6900 },
]);
caso('cheio: tabela presente', cheio.includes('<table'));
caso('cheio: tabela rola horizontalmente em telas estreitas', cheio.includes('overflow-x-auto') && /min-w-\[\d+rem\]/.test(cheio));
caso('cheio: título linka para o produto', cheio.includes('/produto/fundamentos-de-aprendizado-profundo'));
caso('cheio: preço unitário em mono', cheio.includes('R$ 159,00'));
caso('cheio: total da linha (2 x 159)', cheio.includes('R$ 318,00'));
caso('cheio: subtotal 318 + 69', cheio.includes('R$ 387,00'));
caso('cheio: seletor com id por produto', cheio.includes('id="quantidade-prod-001"'));
caso('cheio: e-book com etiqueta de download', cheio.includes('entrega por download'));
caso('cheio: peso só do físico (2 x 980)', cheio.includes('1960 g'));
caso('cheio: aviso de frete no checkout', cheio.includes('Frete e prazo são calculados no checkout'));
caso('cheio: botão finalizar leva ao checkout', cheio.includes('href="/checkout"') && cheio.includes('Finalizar compra'));
caso('cheio: continuar comprando', cheio.includes('Continuar comprando'));
caso('cheio: remover tem rótulo acessível', cheio.includes('aria-label="Remover Fundamentos de Aprendizado Profundo do carrinho"'));
caso('cheio: contador do cabeçalho mostra 3', cheio.includes('aria-label="Carrinho, 3 itens"'));
caso('cheio: capa com alt descritivo', cheio.includes('alt="Capa de Segurança de Modelos de Linguagem, de Camila Brandão"'));

/* --- dois fisicos: ids unicos --- */
const doisFisicos = comArmazenamento([
  { produtoId: 'prod-001', quantidade: 1, precoUnitario: 15900 },
  { produtoId: 'prod-006', quantidade: 1, precoUnitario: 14200 },
]);
caso('dois fisicos: ids de campo distintos', doisFisicos.includes('id="quantidade-prod-001"') && doisFisicos.includes('id="quantidade-prod-006"'));
caso('dois fisicos: nenhum id repetido', idsSaoUnicos(doisFisicos));
caso('dois fisicos: rotulo cita o produto', doisFisicos.includes('Quantidade de Algoritmos de Busca e Planejamento'));
caso('dois fisicos: botoes citam o produto', doisFisicos.includes('aria-label="Aumentar quantidade de Fundamentos de Aprendizado Profundo"'));

/* --- só e-book: sem frete, sem peso --- */
const soEbook = comArmazenamento([{ produtoId: 'prod-005', quantidade: 1, precoUnitario: 6900 }]);
caso('só e-book: não fala em frete no checkout', !soEbook.includes('Frete e prazo são calculados'));
caso('só e-book: diz que não há frete', soEbook.includes('sem frete, entrega por download'));
caso('só e-book: sem linha de peso', !/\d+ g</.test(soEbook));

/* --- avisos da reconciliação --- */
const comAvisos = comArmazenamento([
  { produtoId: 'prod-001', quantidade: 1, precoUnitario: 18900 },
  { produtoId: 'prod-999', quantidade: 1, precoUnitario: 100 },
]);
caso('avisos: mudança de preço aparece', comAvisos.includes('mudou de R$ 189,00 para R$ 159,00'));
caso('avisos: item fantasma aparece', comAvisos.includes('saiu do catálogo e foi removido'));
caso('avisos: região aria-live', comAvisos.includes('aria-live="polite"'));
caso('avisos: cada um é dispensável', comAvisos.includes('Dispensar'));
caso('avisos: item fantasma não vira linha', !comAvisos.includes('prod-999'));

/* --- reconciliação contra o catálogo vivo do ProdutosContext ---
   Confirma a consequência da Tarefa 0: o carrinho reconcilia contra o
   catálogo do ProdutosContext, não contra o mock estático. Simula um
   preço e um estoque já editados (Tarefa 2), seedando compia:produtos:v1
   diferente do mock embutido. */
const catalogoComPrecoEditado = produtosMock.map((produto) =>
  produto.id === 'prod-001' ? { ...produto, precoPromocional: 12000 } : produto,
);
const precoEditado = renderizarComProvedores('/carrinho', {
  comLayout: true,
  carrinhos: { 'cli-001': [{ produtoId: 'prod-001', quantidade: 1, precoUnitario: 15900 }] },
  produtos: catalogoComPrecoEditado,
});
caso(
  'preço editado no ProdutosContext dispara o aviso de reconciliação',
  precoEditado.includes('mudou de R$ 159,00 para R$ 120,00'),
);
caso('preço editado: linha usa o preço vigente do catálogo, não o congelado', precoEditado.includes('R$ 120,00'));

const catalogoComEstoqueReduzido = produtosMock.map((produto) =>
  produto.id === 'prod-006' ? { ...produto, estoque: 1 } : produto,
);
const estoqueReduzido = renderizarComProvedores('/carrinho', {
  comLayout: true,
  carrinhos: { 'cli-001': [{ produtoId: 'prod-006', quantidade: 3, precoUnitario: 14200 }] },
  produtos: catalogoComEstoqueReduzido,
});
caso(
  'estoque reduzido no ProdutosContext dispara o aviso de reconciliação',
  estoqueReduzido.includes('teve a quantidade reduzida de 3 para 1, o estoque disponível'),
);
caso('estoque reduzido: quantidade da linha cai para o novo teto', estoqueReduzido.includes('id="quantidade-prod-006"') && estoqueReduzido.includes('value="1"'));

/* --- singular no contador --- */
const umItem = comArmazenamento([{ produtoId: 'prod-005', quantidade: 1, precoUnitario: 6900 }]);
caso('contador no singular', umItem.includes('aria-label="Carrinho, 1 item"'));

delete globalThis.localStorage;
console.log('\n' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
