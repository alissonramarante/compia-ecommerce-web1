import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProductFilter } from "@/components/product/ProductFilter";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useProducts } from "@/hooks/useCatalog";
import { allTags, applyFilters, defaultFilters, type CatalogFilters } from "@/lib/catalog";

const PAGE_SIZE = 8;

export default function Catalogo() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const { data: produtos, isLoading } = useProducts();
  const [filters, setFilters] = useState<CatalogFilters>({ ...defaultFilters, q });
  useEffect(() => {
    setFilters((current) => ({ ...current, q }));
  }, [q]);
  const [visiveis, setVisiveis] = useState(PAGE_SIZE);

  const lista = produtos ?? [];
  const categorias = useMemo(
    () => Array.from(new Set(lista.map((p) => p.categoria))).sort(),
    [lista],
  );
  const tags = useMemo(() => allTags(lista), [lista]);
  const precoLimite = useMemo(
    () => Math.max(200, Math.ceil(Math.max(...lista.map((p) => p.valor), 200) / 10) * 10),
    [lista],
  );

  const termo = filters.q ?? "";
  const resultados = useMemo(() => applyFilters(lista, filters), [lista, filters]);

  const update = (next: CatalogFilters) => {
    setFilters(next);
    setVisiveis(PAGE_SIZE);
  };

  const sidebar = (
    <ProductFilter
      filters={filters}
      onChange={update}
      categorias={categorias}
      tags={tags}
      precoLimite={precoLimite}
    />
  );

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold">Catálogo COMPIA</h1>
        <p className="mt-2 text-muted-foreground">
          {isLoading ? "Carregando materiais..." : `${resultados.length} materiais encontrados`}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="surface-card sticky top-32 p-5">{sidebar}</div>
          </aside>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={termo}
                onChange={(e) => update({ ...filters, q: e.target.value })}
                placeholder="Buscar no catálogo"
                aria-label="Buscar no catálogo"
                className="h-11"
              />
              <div className="flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="h-11 lg:hidden">
                      <SlidersHorizontal className="size-4" /> Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] overflow-y-auto p-6">
                    <SheetTitle className="sr-only">Filtros do catálogo</SheetTitle>
                    {sidebar}
                  </SheetContent>
                </Sheet>

                <Select
                  value={filters.ordenacao}
                  onValueChange={(value) => update({ ...filters, ordenacao: value })}
                >
                  <SelectTrigger className="h-11 w-47.5" aria-label="Ordenar">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevancia">Relevância</SelectItem>
                    <SelectItem value="menor-preco">Menor preço</SelectItem>
                    <SelectItem value="maior-preco">Maior preço</SelectItem>
                    <SelectItem value="avaliacao">Melhor avaliados</SelectItem>
                    <SelectItem value="titulo">Título (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6">
              {isLoading ? (
                <ProductGridSkeleton />
              ) : (
                <>
                  <ProductGrid produtos={resultados.slice(0, visiveis)} />
                  {visiveis < resultados.length && (
                    <div className="mt-8 flex justify-center">
                      <Button variant="outline" onClick={() => setVisiveis((v) => v + PAGE_SIZE)}>
                        Carregar mais materiais
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
