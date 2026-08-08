import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormatBadge, Price, Rating, StockBadge } from "./ProductMeta";
import { formatPages } from "@/lib/format";
import { useCart } from "@/store/cart";
import type { Produto } from "@/types";

export function ProductCard({ produto }: { produto: Produto }) {
  const { addItem } = useCart();

  const esgotado =
    produto.formato === "fisico" && produto.estoque <= 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm transition-shadow hover:shadow-md">
      {/* Imagem */}
      <Link
        to={`/produtos/${String(produto.id)}`}
        className="block overflow-hidden"
      >
        <img
          src={produto.imagens[0]}
          alt={`Capa do material ${produto.titulo}`}
          width={768}
          height={1024}
          loading="lazy"
          className="aspect-3/4 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Formato e categoria */}
        <div className="flex flex-wrap items-center gap-2">
          <FormatBadge produto={produto} />

          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {produto.categoria}
          </span>
        </div>

        {/* Título */}
        <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug">
          <Link
            to={`/produtos/${produto.id}`}
            className="hover:underline"
          >
            {produto.titulo}
          </Link>
        </h3>

        {/* Avaliação */}
        <Rating produto={produto} />

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {produto.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="font-normal"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Páginas / SKU */}
        <p className="text-xs text-muted-foreground">
          {formatPages(produto.paginas)} · SKU {produto.sku}
        </p>

        {/* Preço e ações */}
        <div className="mt-auto space-y-3 pt-2">
          <div>
            <Price value={produto.valor} />

            <div>
              <StockBadge produto={produto} />
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              disabled={esgotado}
              onClick={() => addItem(produto)}
            >
              {esgotado
                ? "Produto esgotado"
                : "Adicionar ao carrinho"}
            </Button>

            <Button
              variant="outline"
              asChild
              className="w-full"
            >
              <Link to={`/produtos/${produto.id}`}>
                Ver detalhes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}