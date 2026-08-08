import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "./ProductCard";
import type { Produto } from "@/types";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card overflow-hidden p-0">
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductGrid({ produtos }: { produtos: Produto[] }) {
  if (produtos.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center gap-3 p-12 text-center">
        <h3 className="font-display text-lg font-semibold">Nenhum produto encontrado</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Tente ajustar a busca ou remover alguns filtros para ver mais materiais do catálogo.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {produtos.map((produto) => (
        <ProductCard key={produto.id} produto={produto} />
      ))}
    </div>
  );
}
