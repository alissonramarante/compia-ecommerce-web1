import type {
  FiltrosCatalogo,
  OrdenacaoCatalogo,
  Produto,
  TipoProduto,
} from '../types';
import { categorias } from '../mocks';

/**
 * Regras do catálogo. Nada de React aqui: a página lê a URL, chama estas
 * funções e renderiza o resultado. Tudo é puro e não muta a entrada.
 */

/* ------------------------------------------------------------------ */
/* 1. Preço, estoque e promoção                                        */
/* ------------------------------------------------------------------ */

/**
 * Preço que o cliente paga hoje, em centavos.
 *
 * Testes de mesa (mocks):
 *   precoVigente(prod-001)  → 15900  (tem precoPromocional)
 *   precoVigente(prod-002)  → 21500  (não tem)
 *   precoVigente(prod-009)  → 44900
 */
export function precoVigente(produto: Produto): number {
  return produto.precoPromocional ?? produto.preco;
}

/**
 * `estoque === null` significa ilimitado (e-book), não indisponível.
 *
 * Testes de mesa:
 *   estaDisponivel(prod-003 | estoque null) → true
 *   estaDisponivel(prod-006 | estoque 3)    → true
 *   estaDisponivel(prod-008 | estoque 0)    → false
 */
export function estaDisponivel(produto: Produto): boolean {
  return produto.estoque === null || produto.estoque > 0;
}

/**
 * Faixa de alerta de estoque: 1 a 5 unidades. Ilimitado e esgotado ficam
 * de fora — esgotado tem selo próprio.
 *
 * Testes de mesa:
 *   estoqueBaixo(prod-006 | 3)    → true
 *   estoqueBaixo(prod-002 | 7)    → false
 *   estoqueBaixo(prod-008 | 0)    → false
 *   estoqueBaixo(prod-003 | null) → false
 */
export function estoqueBaixo(produto: Produto): boolean {
  return produto.estoque !== null && produto.estoque >= 1 && produto.estoque <= 5;
}

/**
 * Economia em pontos percentuais, arredondada. `null` quando não há
 * promoção — ou quando o "promocional" não é menor que o cheio, que seria
 * um dado inconsistente e não deve virar selo.
 *
 * Testes de mesa:
 *   percentualDeDesconto(prod-001 | 18900 → 15900) → 16
 *   percentualDeDesconto(prod-005 |  8700 →  6900) → 21
 *   percentualDeDesconto(prod-009 | 54600 → 44900) → 18
 *   percentualDeDesconto(prod-002 | sem promoção)  → null
 */
export function percentualDeDesconto(produto: Produto): number | null {
  const promocional = produto.precoPromocional;
  if (promocional === undefined || promocional >= produto.preco) return null;

  return Math.round((1 - promocional / produto.preco) * 100);
}

/* ------------------------------------------------------------------ */
/* 2. Busca                                                            */
/* ------------------------------------------------------------------ */

/**
 * Caixa baixa e sem diacrítico, para "matematica" achar "Matemática".
 * NFD separa a letra do acento; o intervalo U+0300-U+036F remove os acentos
 * soltos que sobraram.
 *
 * Testes de mesa:
 *   normalizarTexto('Matemática')  → 'matematica'
 *   normalizarTexto('PÓS-QUÂNTICA') → 'pos-quantica'
 *   normalizarTexto('  Ana Lúcia ') → 'ana lucia'
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Campos que a busca cobre: título, subtítulo e autores. */
function textoBuscavel(produto: Produto): string {
  return normalizarTexto(
    [produto.titulo, produto.subtitulo ?? '', ...produto.autores].join(' '),
  );
}

/* ------------------------------------------------------------------ */
/* 3. Leitura dos filtros a partir da URL                              */
/* ------------------------------------------------------------------ */

const TIPOS_VALIDOS: readonly TipoProduto[] = ['fisico', 'ebook', 'kit'];

const ORDENACOES_VALIDAS: readonly OrdenacaoCatalogo[] = [
  'relevancia',
  'menor_preco',
  'maior_preco',
  'lancamentos',
  'titulo_az',
];

function ehTipoValido(valor: string): valor is TipoProduto {
  return (TIPOS_VALIDOS as readonly string[]).includes(valor);
}

function ehOrdenacaoValida(valor: string): valor is OrdenacaoCatalogo {
  return (ORDENACOES_VALIDAS as readonly string[]).includes(valor);
}

/**
 * A URL carrega reais ("?precoMin=50"), porque é o que a pessoa digitou e
 * o que faz sentido num link compartilhado. O domínio trabalha em centavos,
 * então a conversão acontece aqui, na fronteira.
 *
 * Testes de mesa:
 *   lerReaisEmCentavos('50')    → 5000
 *   lerReaisEmCentavos('49,90') → 4990
 *   lerReaisEmCentavos('0')     → 0
 *   lerReaisEmCentavos('-1')    → undefined
 *   lerReaisEmCentavos('abc')   → undefined
 *   lerReaisEmCentavos(null)    → undefined
 */
function lerReaisEmCentavos(valor: string | null): number | undefined {
  if (valor === null || valor.trim() === '') return undefined;

  const numero = Number(valor.replace(',', '.'));
  if (!Number.isFinite(numero) || numero < 0) return undefined;

  return Math.round(numero * 100);
}

/**
 * Caminho de volta: centavos → reais inteiros, para preencher o campo da
 * faixa de preço. A faixa não trabalha com centavos, então um valor quebrado
 * vindo de uma URL escrita à mão é arredondado só na exibição — o filtro em
 * si continua usando o valor exato.
 *
 * Testes de mesa:
 *   precoEmReais(5000)      → '50'
 *   precoEmReais(19990)     → '200'
 *   precoEmReais(0)         → '0'
 *   precoEmReais(undefined) → ''
 */
export function precoEmReais(centavos: number | undefined): string {
  return centavos === undefined ? '' : String(Math.round(centavos / 100));
}

/**
 * Traduz os parâmetros da URL no objeto de filtros. Estágios:
 *   1. `?categoria=` vem por slug (legível no link) e vira id, que é o que
 *      o produto guarda. Slug desconhecido é preservado como veio: não casa
 *      com nenhum produto e o resultado sai vazio, em vez de a URL ruim
 *      passar despercebida mostrando tudo.
 *   2. Valores fora do domínio (`?tipo=livro`, `?ordem=xpto`) são
 *      descartados; a ordenação cai no padrão.
 *   3. Preço entra em reais e sai em centavos.
 *
 * Testes de mesa:
 *   ''                                  → busca '', 0 categorias, ordem 'relevancia'
 *   '?categoria=criptografia'           → categoriaIds ['cat-cripto']
 *   '?categoria=inexistente'            → categoriaIds ['inexistente']
 *   '?tipo=ebook&tipo=livro'            → tipos ['ebook']
 *   '?ordem=xpto'                       → ordenacao 'relevancia'
 *   '?precoMin=50&precoMax=199,90'      → precoMin 5000, precoMax 19990
 *   '?estoque=1'                        → somenteEmEstoque true
 */
export function lerFiltrosDaUrl(parametros: URLSearchParams): FiltrosCatalogo {
  // 1. Slug → id.
  const categoriaIds = parametros.getAll('categoria').map((slug) => {
    const categoria = categorias.find((candidata) => candidata.slug === slug);
    return categoria ? categoria.id : slug;
  });

  // 2. Só valores do domínio sobrevivem.
  const ordemBruta = parametros.get('ordem');
  const ordenacao: OrdenacaoCatalogo =
    ordemBruta !== null && ehOrdenacaoValida(ordemBruta) ? ordemBruta : 'relevancia';

  return {
    busca: parametros.get('busca') ?? '',
    categoriaIds,
    tipos: parametros.getAll('tipo').filter(ehTipoValido),
    tags: parametros.getAll('tag'),
    // 3. Reais na URL, centavos no domínio.
    precoMin: lerReaisEmCentavos(parametros.get('precoMin')),
    precoMax: lerReaisEmCentavos(parametros.get('precoMax')),
    somenteEmEstoque: parametros.get('estoque') === '1',
    ordenacao,
  };
}

/**
 * Quantos filtros estão ativos. A ordenação não conta: ela sempre tem um
 * valor, não é algo que a pessoa "aplicou".
 *
 * Testes de mesa:
 *   nenhum parâmetro                        → 0
 *   '?busca=ia'                             → 1
 *   '?categoria=criptografia&tipo=ebook'    → 2
 *   '?precoMin=50&precoMax=200&estoque=1'   → 3
 *   '?ordem=menor_preco'                    → 0
 */
export function contarFiltrosAtivos(filtros: FiltrosCatalogo): number {
  let total = 0;

  if (filtros.busca.trim() !== '') total += 1;
  total += filtros.categoriaIds.length;
  total += filtros.tipos.length;
  total += filtros.tags.length;
  if (filtros.precoMin !== undefined) total += 1;
  if (filtros.precoMax !== undefined) total += 1;
  if (filtros.somenteEmEstoque) total += 1;

  return total;
}

/* ------------------------------------------------------------------ */
/* 4. Filtragem                                                        */
/* ------------------------------------------------------------------ */

/**
 * Aplica todos os filtros. Dentro de um grupo a relação é OU (duas
 * categorias marcadas somam resultados); entre grupos é E (categoria E
 * tipo E faixa de preço). Grupo vazio não filtra nada.
 *
 * Testes de mesa (sobre os 10 produtos do mock):
 *   sem filtro                        → 10 títulos
 *   busca 'matematica'                → 1  (Matemática Essencial para IA)
 *   busca 'POS-QUANTICA'              → 1  (acha 'Pós-Quântica' no título)
 *   busca 'ana lucia'                 → 1  (acha pelo autor 'Ana Lúcia Ferraz')
 *   busca 'transformers'              → 1  (acha pelo subtítulo)
 *   tipos ['ebook']                   → 4
 *   tipos ['ebook','kit']             → 5
 *   categorias ['cat-didaticos']      → 4
 *   somenteEmEstoque                  → 9  (prod-008 está zerado)
 *   precoMin 20000                    → 2  (prod-002 e prod-009)
 *   tipos ['ebook'] + precoMax 5000   → 1  (Revista nº 01)
 */
export function filtrarProdutos(produtos: Produto[], filtros: FiltrosCatalogo): Produto[] {
  const termo = normalizarTexto(filtros.busca);

  return produtos.filter((produto) => {
    // 1. Busca em título, subtítulo e autores.
    if (termo !== '' && !textoBuscavel(produto).includes(termo)) return false;

    // 2. Categoria.
    if (
      filtros.categoriaIds.length > 0 &&
      !produto.categoriaIds.some((id) => filtros.categoriaIds.includes(id))
    ) {
      return false;
    }

    // 3. Tipo.
    if (filtros.tipos.length > 0 && !filtros.tipos.includes(produto.tipo)) return false;

    // 4. Tag.
    if (filtros.tags.length > 0 && !produto.tags.some((tag) => filtros.tags.includes(tag))) {
      return false;
    }

    // 5. Faixa de preço, sempre sobre o preço vigente.
    const preco = precoVigente(produto);
    if (filtros.precoMin !== undefined && preco < filtros.precoMin) return false;
    if (filtros.precoMax !== undefined && preco > filtros.precoMax) return false;

    // 6. Disponibilidade.
    if (filtros.somenteEmEstoque && !estaDisponivel(produto)) return false;

    return true;
  });
}

/* ------------------------------------------------------------------ */
/* 5. Ordenação                                                        */
/* ------------------------------------------------------------------ */

/**
 * Devolve uma cópia ordenada; a lista recebida não é tocada.
 *
 * `relevancia` é o padrão e significa: destaques primeiro, depois o mais
 * recente. Sem sinal de busca melhor que esse, é o que a vitrine de uma
 * editora deve mostrar.
 *
 * Testes de mesa (slugs, sobre os 10 produtos do mock):
 *   menor_preco → primeiro 'revista-compia-01-agentes'      (R$ 39,00)
 *   maior_preco → primeiro 'kit-trilha-ia-aplicada'         (R$ 449,00)
 *   lancamentos → primeiro 'seguranca-de-modelos-de-linguagem' (2026-02-18)
 *   titulo_az   → primeiro 'algoritmos-de-busca-e-planejamento'
 *   relevancia  → primeiro 'seguranca-de-modelos-de-linguagem' (destaque + recente)
 */
export function ordenarProdutos(
  produtos: Produto[],
  ordenacao: OrdenacaoCatalogo,
): Produto[] {
  const copia = [...produtos];

  switch (ordenacao) {
    case 'menor_preco':
      return copia.sort((a, b) => precoVigente(a) - precoVigente(b));

    case 'maior_preco':
      return copia.sort((a, b) => precoVigente(b) - precoVigente(a));

    case 'lancamentos':
      return copia.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

    case 'titulo_az':
      return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));

    case 'relevancia':
      return copia.sort((a, b) => {
        if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
        return b.criadoEm.localeCompare(a.criadoEm);
      });
  }
}

/* ------------------------------------------------------------------ */
/* 6. Contagem por categoria                                           */
/* ------------------------------------------------------------------ */

/**
 * Quantos títulos cada categoria tem, indexado pelo **id** da categoria —
 * é o que o produto guarda em `categoriaIds`. Um produto em duas categorias
 * conta nas duas, por isso a soma passa do total de produtos.
 *
 * Testes de mesa (sobre os 10 produtos do mock):
 *   contarPorCategoria(produtos)['cat-ia']             → 8
 *   contarPorCategoria(produtos)['cat-arq']            → 4
 *   contarPorCategoria(produtos)['cat-didaticos']      → 4
 *   contarPorCategoria(produtos)['cat-ciberseguranca'] → 2
 *   contarPorCategoria(produtos)['cat-blockchain']     → 1
 *   contarPorCategoria(produtos)['cat-cripto']         → 1
 *   contarPorCategoria([])['cat-ia']                   → undefined
 */
export function contarPorCategoria(produtos: Produto[]): Record<string, number> {
  const contagem: Record<string, number> = {};

  for (const produto of produtos) {
    for (const id of produto.categoriaIds) {
      contagem[id] = (contagem[id] ?? 0) + 1;
    }
  }

  return contagem;
}
