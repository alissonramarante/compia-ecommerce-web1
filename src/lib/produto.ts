import type { Categoria, Produto } from '../types';
import { precoVigente } from './catalogo';

/**
 * Regras da página do produto. Puras, sem React, sem acesso aos mocks —
 * quem carrega os dados é a página.
 */

/**
 * Sentinela de autoria coletiva usada nos mocks (revista e kit). É rótulo,
 * não pessoa: não vira link para `?busca=`, porque buscar por "Vários
 * autores" não devolve nada útil.
 */
export const AUTOR_COLETIVO = 'Vários autores';

/* ------------------------------------------------------------------ */
/* 1. Localização                                                      */
/* ------------------------------------------------------------------ */

/**
 * Testes de mesa:
 *   buscarPorSlug(produtos, 'kit-trilha-ia-aplicada')?.id → 'prod-009'
 *   buscarPorSlug(produtos, 'nao-existe')                 → undefined
 *   buscarPorSlug(produtos, '')                           → undefined
 */
export function buscarPorSlug(produtos: Produto[], slug: string): Produto | undefined {
  return produtos.find((produto) => produto.slug === slug);
}

/**
 * Traduz ids em categorias, na ordem em que o produto os declara — a
 * primeira é a principal, usada na trilha de navegação. Id desconhecido é
 * descartado.
 *
 * Testes de mesa:
 *   nomesDasCategorias(categorias, ['cat-ia'])            → ['Inteligência Artificial']
 *   nomesDasCategorias(categorias, ['cat-arq','cat-ia'])  → ['Arquitetura de Software', 'Inteligência Artificial']
 *   nomesDasCategorias(categorias, ['cat-xpto'])          → []
 *   nomesDasCategorias(categorias, [])                    → []
 */
export function nomesDasCategorias(categorias: Categoria[], ids: string[]): Categoria[] {
  return ids
    .map((id) => categorias.find((categoria) => categoria.id === id))
    .filter((categoria): categoria is Categoria => categoria !== undefined);
}

/* ------------------------------------------------------------------ */
/* 2. Kit                                                              */
/* ------------------------------------------------------------------ */

/**
 * Títulos que compõem o kit, na ordem declarada. Produto que não é kit
 * devolve lista vazia; id que não existe mais é descartado em vez de virar
 * buraco na lista.
 *
 * Testes de mesa:
 *   produtosDoKit(produtos, prod-009).map(p => p.id) → ['prod-001','prod-002','prod-008']
 *   produtosDoKit(produtos, prod-001)                → []
 */
export function produtosDoKit(produtos: Produto[], kit: Produto): Produto[] {
  const ids = kit.itensDoKit ?? [];

  return ids
    .map((id) => produtos.find((produto) => produto.id === id))
    .filter((produto): produto is Produto => produto !== undefined);
}

/**
 * Quanto o kit economiza em relação a comprar os títulos separados hoje.
 *
 * Os dois lados usam **preço vigente**: é a comparação honesta entre o que
 * a pessoa paga no kit e o que pagaria comprando um a um agora, com as
 * promoções que existirem.
 *
 * Kit sem itens devolve tudo zerado, e `percentual` é 0 em vez de NaN.
 *
 * `economia` pode ser zero ou negativa: nada impede que o kit custe o mesmo
 * ou mais que os avulsos, sobretudo depois que o admin da Fatia 7 puder
 * editar preços. A função devolve o número como ele é — quem decide não
 * exibir vantagem inexistente é a página, que só mostra o bloco quando
 * `economia > 0`.
 *
 * Testes de mesa (prod-009 = prod-001 15900 + prod-002 21500 + prod-008 19900):
 *   economiaDoKit(produtos, prod-009)        → { soma: 57300, economia: 12400, percentual: 22 }
 *   economiaDoKit(produtos, prod-001)        → { soma: 0, economia: 0, percentual: 0 }
 *   kit custando 60000 (acima da soma)       → { soma: 57300, economia: -2700, percentual: -5 }
 *   kit custando exatamente 57300            → { soma: 57300, economia: 0, percentual: 0 }
 */
export function economiaDoKit(
  produtos: Produto[],
  kit: Produto,
): { soma: number; economia: number; percentual: number } {
  const itens = produtosDoKit(produtos, kit);
  const soma = itens.reduce((total, item) => total + precoVigente(item), 0);

  if (soma === 0) return { soma: 0, economia: 0, percentual: 0 };

  const economia = soma - precoVigente(kit);

  return {
    soma,
    economia,
    percentual: Math.round((economia / soma) * 100),
  };
}

/* ------------------------------------------------------------------ */
/* 3. Relacionados                                                     */
/* ------------------------------------------------------------------ */

/** Quantas categorias dois produtos têm em comum. */
function categoriasEmComum(a: Produto, b: Produto): number {
  return a.categoriaIds.filter((id) => b.categoriaIds.includes(id)).length;
}

/**
 * Títulos da mesma prateleira. Ordena por número de categorias em comum e,
 * no empate, pelo mais recente — sem o desempate a ordem dependeria da
 * ordem do array de origem, que é acidental.
 *
 * O próprio produto nunca aparece.
 *
 * Testes de mesa:
 *   relacionados(produtos, prod-001, 3).map(p => p.id) → ['prod-009','prod-010','prod-006']
 *     (prod-009, 010 e 006 dividem 2 categorias com prod-001; ordenados por data)
 *   relacionados(produtos, prod-004, 3) → []   (único de cat-blockchain)
 *   relacionados(produtos, prod-001, 0) → []
 */
export function relacionados(
  produtos: Produto[],
  produto: Produto,
  limite: number,
): Produto[] {
  return produtos
    .filter((candidato) => candidato.id !== produto.id)
    .map((candidato) => ({ candidato, comuns: categoriasEmComum(produto, candidato) }))
    .filter((entrada) => entrada.comuns > 0)
    .sort((a, b) => {
      if (a.comuns !== b.comuns) return b.comuns - a.comuns;
      return b.candidato.criadoEm.localeCompare(a.candidato.criadoEm);
    })
    .slice(0, Math.max(0, limite))
    .map((entrada) => entrada.candidato);
}

/* ------------------------------------------------------------------ */
/* 4. Quantidade                                                       */
/* ------------------------------------------------------------------ */

/**
 * Mantém a quantidade dentro do possível: inteiro, nunca menor que 1, nunca
 * acima do estoque quando ele é finito. `null` é ilimitado (e-book).
 *
 * Testes de mesa:
 *   limitarQuantidade(3, 42)     → 3
 *   limitarQuantidade(0, 42)     → 1
 *   limitarQuantidade(-5, 42)    → 1
 *   limitarQuantidade(50, 42)    → 42
 *   limitarQuantidade(50, null)  → 50
 *   limitarQuantidade(2.7, null) → 2
 *   limitarQuantidade(NaN, null) → 1
 */
export function limitarQuantidade(valor: number, maximo: number | null): number {
  if (!Number.isFinite(valor)) return 1;

  const inteiro = Math.floor(valor);
  const comPiso = Math.max(1, inteiro);

  if (maximo === null) return comPiso;
  return Math.max(1, Math.min(comPiso, maximo));
}

/* ------------------------------------------------------------------ */
/* 5. Estoque                                                          */
/* ------------------------------------------------------------------ */

/**
 * Reduz o estoque numérico dos produtos comprados. E-book (`estoque: null`)
 * não muda — não há o que baixar. Nunca fica negativo: comprar mais do que o
 * estoque atual apenas zera, não é uma inconsistência a sinalizar aqui.
 *
 * Produto fora da lista de itens comprados sai intacto.
 *
 * Testes de mesa (prod-002 estoque 7, prod-003 e-book estoque null, prod-006
 * estoque 3):
 *   baixarEstoque(produtos, [{produtoId:'prod-002', quantidade:3}])
 *     → prod-002.estoque 4, demais intactos
 *   baixarEstoque(produtos, [{produtoId:'prod-003', quantidade:1}])
 *     → prod-003.estoque continua null
 *   baixarEstoque(produtos, [{produtoId:'prod-006', quantidade:99}])
 *     → prod-006.estoque 0, nunca negativo
 *   baixarEstoque(produtos, [{produtoId:'zzz', quantidade:1}])
 *     → produtos intactos, item fantasma ignorado
 *   baixarEstoque(produtos, [])
 *     → produtos intactos
 *   não muta o array nem os produtos recebidos
 */
export function baixarEstoque(
  produtos: Produto[],
  itens: { produtoId: string; quantidade: number }[],
): Produto[] {
  return produtos.map((produto) => {
    if (produto.estoque === null) return produto;

    const item = itens.find((candidato) => candidato.produtoId === produto.id);
    if (item === undefined) return produto;

    return { ...produto, estoque: Math.max(0, produto.estoque - item.quantidade) };
  });
}
