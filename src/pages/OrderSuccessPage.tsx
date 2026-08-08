import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Pedido } from "@/types";

export default function PedidoSucesso() {
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("compia:ultimoPedido");
    if (raw) setPedido(JSON.parse(raw) as Pedido);
  }, []);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <div className="surface-card p-8 text-center">
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <h1 className="mt-4 font-display text-3xl font-bold">Pedido confirmado!</h1>
          <p className="mt-2 text-muted-foreground">
            {pedido
              ? `Obrigado, ${pedido.cliente}. Enviamos os detalhes por e-mail.`
              : "Obrigado pela compra na COMPIA."}
          </p>

          {pedido && (
            <div className="mt-8 text-left">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Pedido</span>
                <strong>{pedido.id}</strong>
              </div>
              <div className="mt-1 flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Data</span>
                <span>{formatDate(pedido.data)}</span>
              </div>
              <div className="mt-1 flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="uppercase">{pedido.pagamento}</span>
              </div>
              <Separator className="my-4" />
              <ul className="space-y-2 text-sm">
                {pedido.itens.map((item) => (
                  <li key={item.produtoId} className="flex justify-between gap-3">
                    <span>
                      {item.quantidade}× {item.titulo}
                    </span>
                    <span className="tabular-nums">
                      {formatCurrency(item.valor * item.quantidade)}
                    </span>
                  </li>
                ))}
              </ul>
              <Separator className="my-4" />
              <div className="flex justify-between font-display font-bold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(pedido.total)}</span>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link to="/minha-conta">Ver meus pedidos</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/produtos">Continuar comprando</Link>
            </Button>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
