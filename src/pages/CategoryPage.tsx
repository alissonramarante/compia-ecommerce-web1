import { Link, Navigate, useParams } from "react-router-dom";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useCatalog";
import categoriasJson from "@/data/categorias.json";
import type { Categoria } from "@/types";

export default function CategoriaPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: produtos, isLoading } = useProducts();
  const categoria = (categoriasJson as Categoria[]).find((c) => c.slug === slug);
  if (!categoria) return <Navigate to="/404" replace />;

  const lista = (produtos ?? []).filter(
    (p) => p.categoria === categoria.nome || p.tags.includes(categoria.nome),
  );

  return (
    <SiteLayout>
      <section className="border-b bg-secondary/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-12">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Categoria</p>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{categoria.nome}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{categoria.descricao}</p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : lista.length ? (
          <ProductGrid produtos={lista} />
        ) : (
          <div className="surface-card flex flex-col items-center gap-4 p-12 text-center">
            <h2 className="font-display text-lg font-semibold">
              Ainda não há materiais nesta categoria
            </h2>
            <Button asChild>
              <Link to="/produtos">Explorar produtos</Link>
            </Button>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
