import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Check, Download, Minus, Plus, Truck } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FormatBadge, Price, Rating, StockBadge } from "@/components/product/ProductMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPages } from "@/lib/format";
import { useProducts } from "@/hooks/useCatalog";
import { useCart } from "@/store/cart";
import produtosJson from "@/data/produtos.json";
import type { Produto } from "@/types";

export default function DetalheProduto() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: produtos, isLoading } = useProducts();
  const { addItem } = useCart();
  const [quantidade, setQuantidade] = useState(1);
  const [imagemAtiva, setImagemAtiva] = useState(0);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 md:grid-cols-2">
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  const produto = (produtos ?? []).find((p) => String(p.id) === id);
  if (!produto) return <Navigate to="/404" replace />;

  const digital = produto.formato === "digital";
  const esgotado = !digital && produto.estoque <= 0;
  const limite = digital ? 99 : produto.estoque;
  const relacionados = (produtos ?? [])
    .filter((p) => p.id !== produto.id && p.categoria === produto.categoria)
    .concat((produtos ?? []).filter((p) => p.id !== produto.id))
    .slice(0, 4);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <nav aria-label="Trilha de navegação" className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Início
          </Link>
          <span className="px-2">/</span>
          <Link to="/produtos" className="hover:text-foreground">
            Catálogo
          </Link>
          <span className="px-2">/</span>
          <span className="text-foreground">{produto.titulo}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
          <div>
            <div className="surface-card overflow-hidden bg-brand-ink p-0">
              <img
                src={produto.imagens[imagemAtiva] ?? produto.imagens[0]}
                alt={`Capa do material ${produto.titulo}`}
                width={768}
                height={1024}
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
            {produto.imagens.length > 1 && (
              <div className="mt-3 flex gap-3">
                {produto.imagens.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setImagemAtiva(i)}
                    aria-label={`Ver imagem ${i + 1}`}
                    className={
                      i === imagemAtiva
                        ? "overflow-hidden rounded-md border-2 border-primary"
                        : "overflow-hidden rounded-md border"
                    }
                  >
                    <img src={img} alt="" width={80} height={106} className="h-20 w-16 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <FormatBadge produto={produto} />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {produto.categoria}
              </span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
              {produto.titulo}
            </h1>
            <div className="mt-3">
              <Rating produto={produto} />
            </div>

            <p className="mt-5 text-muted-foreground">{produto.descricao}</p>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Páginas</p>
                <p className="font-medium">{formatPages(produto.paginas)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Formato</p>
                <p className="font-medium">{digital ? "Digital" : "Físico"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">SKU</p>
                <p className="font-medium">{produto.sku}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Disponível</p>
                <p className="font-medium">{digital ? "Ilimitado" : `${produto.estoque} un.`}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {produto.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>

            <Separator className="my-6" />

            <Price value={produto.valor} className="text-3xl" />
            <div className="mt-1">
              <StockBadge produto={produto} />
            </div>

            <div className="mt-4 rounded-lg border bg-secondary/50 p-4 text-sm">
              {digital ? (
                <div className="flex gap-3">
                  <Download className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Entrega digital gratuita</p>
                    <p className="text-muted-foreground">
                      Disponível para download após a confirmação do pagamento.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Envio para todo o Brasil</p>
                    <p className="text-muted-foreground">
                      O frete é calculado no carrinho a partir do seu CEP.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex w-fit items-center rounded-md border">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Diminuir quantidade"
                  onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-10 text-center text-sm font-medium tabular-nums">
                  {quantidade}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Aumentar quantidade"
                  disabled={quantidade >= limite}
                  onClick={() => setQuantidade((q) => Math.min(limite, q + 1))}
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              <Button
                size="lg"
                className="flex-1"
                disabled={esgotado}
                onClick={() => addItem(produto, quantidade)}
              >
                {esgotado ? "Produto esgotado" : "Adicionar ao carrinho"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                disabled={esgotado}
                onClick={() => {
                  addItem(produto, quantidade);
                  navigate("/checkout");
                }}
              >
                Comprar agora
              </Button>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {[
                digital ? "Acesso imediato na área de downloads" : "Embalagem protegida para transporte",
                "Nota fiscal e suporte institucional",
                "Descontos para adoção acadêmica em volume",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="size-4 text-success" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Você também pode gostar</h2>
          <div className="mt-6">
            <ProductGrid produtos={relacionados} />
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
