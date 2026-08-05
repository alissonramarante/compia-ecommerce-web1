import type { Produto, TipoProduto } from '../types';

/**
 * Persistência dos produtos. Mesmas premissas do carrinho, da sessão e dos
 * pedidos: o conteúdo lido não é confiável e o armazenamento pode lançar.
 */

export const CHAVE_PRODUTOS = 'compia:produtos:v1';

const TIPOS_VALIDOS: readonly TipoProduto[] = ['fisico', 'ebook', 'kit'];

const ehTextoNaoVazio = (valor: unknown): valor is string =>
  typeof valor === 'string' && valor !== '';

/**
 * Validação de superfície, não de profundidade: confere os campos que o
 * catálogo indexa, filtra e soma (id, slug, tipo, preço, estoque, peso). O
 * interior de `ficha` não é auditado campo a campo — o risco real aqui é
 * lixo grosseiro, não uma `FichaCatalografica` sutilmente inválida.
 */
function ehProdutoValido(valor: unknown): valor is Produto {
  if (typeof valor !== 'object' || valor === null) return false;

  const p = valor as Record<string, unknown>;

  return (
    ehTextoNaoVazio(p.id) &&
    ehTextoNaoVazio(p.slug) &&
    ehTextoNaoVazio(p.titulo) &&
    Array.isArray(p.autores) &&
    typeof p.tipo === 'string' &&
    (TIPOS_VALIDOS as readonly string[]).includes(p.tipo) &&
    Array.isArray(p.categoriaIds) &&
    Array.isArray(p.tags) &&
    Number.isFinite(p.preco) &&
    (p.estoque === null || Number.isFinite(p.estoque)) &&
    Number.isFinite(p.peso) &&
    Array.isArray(p.imagens) &&
    typeof p.descricao === 'string' &&
    typeof p.destaque === 'boolean' &&
    ehTextoNaoVazio(p.criadoEm)
  );
}

export function serializar(produtos: Produto[]): string {
  return JSON.stringify(produtos);
}

/**
 * Testes de mesa:
 *   desserializar(serializar(produtos))    → os 10 produtos dos mocks
 *   desserializar('{{{')                   → []      (não lança)
 *   desserializar('')                      → []
 *   desserializar('{}')                    → []      (não é array)
 *   produto sem slug                       → descartado
 *   produto com tipo inventado             → descartado
 *   produto com estoque string             → descartado
 *   produto com estoque null (e-book)      → mantido
 *   array misto                            → só os válidos sobrevivem
 */
export function desserializar(bruto: string): Produto[] {
  let analisado: unknown;

  try {
    analisado = JSON.parse(bruto);
  } catch {
    return [];
  }

  if (!Array.isArray(analisado)) return [];

  return analisado.filter(ehProdutoValido);
}

export function carregar(): Produto[] | null {
  try {
    if (typeof localStorage === 'undefined') return null;

    const bruto = localStorage.getItem(CHAVE_PRODUTOS);
    if (bruto === null) return null;

    return desserializar(bruto);
  } catch {
    return null;
  }
}

export function salvar(produtos: Produto[]): void {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(CHAVE_PRODUTOS, serializar(produtos));
  } catch {
    /* Sem espaço ou sem permissão: a sessão segue, só não persiste. */
  }
}

/**
 * Carga inicial. Sem nada gravado, semeia com os mocks — o catálogo não pode
 * abrir vazio numa demonstração.
 *
 * Depois da primeira gravação o armazenamento manda: um produto criado ou
 * editado no admin não é sobrescrito pela semente a cada recarga.
 *
 * Testes de mesa:
 *   sem nada gravado        → os 10 produtos dos mocks
 *   gravado com 1 produto   → só esse 1
 *   gravado vazio ('[]')    → []    (o admin apagou tudo, é intencional)
 *   gravado corrompido      → []    (não lança; a chave é reescrita na sequência)
 */
export function carregarProdutos(semente: Produto[]): Produto[] {
  const guardados = carregar();

  return guardados === null ? semente : guardados;
}
