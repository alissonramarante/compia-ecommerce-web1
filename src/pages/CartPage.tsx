import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ShippingCalculator } from "@/components/checkout/ShippingCalculator";
import { FormatBadge } from "@/components/product/ProductMeta";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";
import { useShipping } from "@/hooks/useShipping";
import { useCart } from "@/store/cart";

export default function Carrinho() {
  const { items, subtotal, removeItem, updateQuantity, hasFisico } = useCart();
  const shipping = useShipping();

  const frete = hasFisico ? (shipping.selection?.valor ?? 0) : 0;
  const total = subtotal + frete;

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
          <ShoppingCart className="size-12 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold">Seu carrinho está vazio.</h1>
          <p className="text-muted-foreground">
            Descubra livros, e-books e kits sobre IA, segurança e arquitetura de software.
          </p>
          <Button asChild size="lg">
            <Link to="/produtos">Explorar produtos</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Carrinho</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {items.map(({ produto, quantidade }) => {
              const limite = produto.formato === "digital" ? 99 : produto.estoque;
              return (
                <article key={produto.id} className="surface-card flex gap-4 p-4">
                  <img
                    src={produto.imagens[0]}
                    alt={produto.titulo}
                    width={96}
                    height={128}
                    loading="lazy"
                    className="h-32 w-24 shrink-0 rounded-md object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="font-display text-base font-semibold">
                          <Link to={`/produtos/${String(produto.id)}`}>
                            {produto.titulo}
                          </Link>
                        </h2>
                        <p className="text-xs text-muted-foreground">SKU {produto.sku}</p>
                      </div>
                      <span className="font-display font-bold tabular-nums">
                        {formatCurrency(produto.valor * quantidade)}
                      </span>
                    </div>
                    <FormatBadge produto={produto} />
                    <div className="mt-auto flex flex-wrap items-center gap-3">
                      <div className="flex items-center rounded-md border">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Diminuir quantidade"
                          onClick={() => updateQuantity(produto.id, quantidade - 1)}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="w-9 text-center text-sm tabular-nums">{quantidade}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Aumentar quantidade"
                          disabled={quantidade >= limite}
                          onClick={() => updateQuantity(produto.id, quantidade + 1)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(produto.id)}
                      >
                        <Trash2 className="size-4" /> Remover
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="space-y-4">
            {hasFisico ? (
              <ShippingCalculator shipping={shipping} />
            ) : (
              <div className="surface-card p-5 text-sm">
                <p className="font-medium">Pedido 100% digital</p>
                <p className="text-muted-foreground">
                  Sem frete e sem endereço de entrega. Acesso liberado após o pagamento.
                </p>
              </div>
            )}

            <div className="surface-card sticky top-32 p-5">
              <h2 className="font-display text-base font-semibold">Resumo do pedido</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Frete</dt>
                  <dd className="tabular-nums">
                    {!hasFisico
                      ? "Grátis (digital)"
                      : shipping.selection
                        ? formatCurrency(frete)
                        : "Informe o CEP"}
                  </dd>
                </div>
              </dl>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold">Total</span>
                <span className="font-display text-xl font-bold tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
              <Button asChild size="lg" className="mt-5 w-full">
                <Link to="/checkout">Finalizar compra</Link>
              </Button>
              <Button asChild variant="ghost" className="mt-2 w-full">
                <Link to="/produtos">Continuar comprando</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
