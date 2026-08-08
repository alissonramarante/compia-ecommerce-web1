import { getDisponibilidade } from "@/lib/format";
import type { Produto } from "@/types";

export interface CatalogFilters {
  q?: string;
  categorias: string[];
  formatos: string[];
  tags: string[];
  disponibilidade: string[];
  precoMax: number;
  ordenacao: string;
}

export const defaultFilters: CatalogFilters = {
  q: "",
  categorias: [],
  formatos: [],
  tags: [],
  disponibilidade: [],
  precoMax: 0,
  ordenacao: "relevancia",
};

export function searchProducts(produtos: Produto[], term: string) {
  const q = term.trim().toLowerCase();
  if (!q) return produtos;
  return produtos.filter((p) =>
    [p.titulo, p.descricao, p.categoria, p.sku, ...p.tags]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

export function applyFilters(produtos: Produto[], filters: CatalogFilters) {
  let result = searchProducts(produtos, filters.q ?? "");

  if (filters.categorias.length)
    result = result.filter((p) => filters.categorias.includes(p.categoria));
  if (filters.formatos.length)
    result = result.filter((p) => filters.formatos.includes(p.formato));
  if (filters.tags.length)
    result = result.filter((p) => p.tags.some((t) => filters.tags.includes(t)));
  if (filters.disponibilidade.length)
    result = result.filter((p) => filters.disponibilidade.includes(getDisponibilidade(p)));
  if (filters.precoMax > 0) result = result.filter((p) => p.valor <= filters.precoMax);

  switch (filters.ordenacao) {
    case "menor-preco":
      result = [...result].sort((a, b) => a.valor - b.valor);
      break;
    case "maior-preco":
      result = [...result].sort((a, b) => b.valor - a.valor);
      break;
    case "avaliacao":
      result = [...result].sort((a, b) => b.avaliacao - a.avaliacao);
      break;
    case "titulo":
      result = [...result].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
      break;
    default:
      result = [...result].sort(
        (a, b) => Number(Boolean(b.destaque)) - Number(Boolean(a.destaque)),
      );
  }

  return result;
}

export function allTags(produtos: Produto[]) {
  return Array.from(new Set(produtos.flatMap((p) => p.tags))).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}
