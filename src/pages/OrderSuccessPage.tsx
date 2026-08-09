import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Download, PackageCheck } from "lucide-react";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { formatCurrency, formatDate } from "@/lib/format";

import type { Pedido } from "@/types";

export default function PedidoSucesso() {
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("compia:ultimoPedido");

    if (raw) {
      setPedido(JSON.parse(raw) as Pedido);
    }
  }, []);

  const possuiFisico = useMemo(() => {
    return pedido?.itens.some((item) => item.formato === "fisico") ?? false;
  }, [pedido]);

  const possuiDigital = useMemo(() => {
    return pedido?.itens.some((item) => item.formato === "digital") ?? false;
  }, [pedido]);

  const pedidoSomenteDigital = possuiDigital && !possuiFisico;

  return (
    <SiteLayout>
      <div className="mx-auto flex w-full max-w-2xl px-4 py-16">
        <div className="surface-card w-full p-6 text-center sm:p-8">
          <div className="flex justify-center">
            <CheckCircle2 className="size-16 text-success" />
          </div>

          <h1 className="mt-5 font-display text-3xl font-bold">Pedido confirmado!</h1>

          <p className="mt-3 text-muted-foreground">
            {pedidoSomenteDigital
              ? `Obrigado, ${pedido?.cliente ?? ""}. Seu material digital está disponível imediatamente.`
              : pedido
                ? `Obrigado, ${pedido.cliente}. Seu pedido foi recebido com sucesso.`
                : "Obrigado pela compra na COMPIA."}
          </p>

          {pedidoSomenteDigital && (
            <div className="mt-6 rounded-xl border border-success/30 bg-success/5 p-5 text-left">
              <div className="flex gap-3">
                <Download className="mt-0.5 size-5 shrink-0 text-success" />

                <div>
                  <h2 className="font-semibold">Seu material digital está pronto</h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {pedido?.email
                      ? `O produto foi enviado para o e-mail ${pedido.email}. Procure na sua caixa de Entrada/Spam.`
                      : "A entrega é imediata. Você poderá acessar seus materiais digitais pela sua conta na COMPIA."}
                  </p>
                </div>
              </div>
            </div>
          )}
          {possuiFisico && (
            <div className="mt-6 rounded-xl border bg-secondary/40 p-5 text-left">
              <div className="flex gap-3">
                <PackageCheck className="mt-0.5 size-5 shrink-0 text-primary" />

                <div>
                  <h2 className="font-semibold">Pedido em preparação</h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Seus materiais físicos serão preparados e enviados para o endereço informado
                    durante a compra.
                  </p>

                  {pedido?.endereco && (
                    <p className="mt-2 text-sm font-medium">{pedido.endereco}</p>
                  )}
                </div>
              </div>
            </div>
          )}

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

              <ul className="space-y-3 text-sm">
                {pedido.itens.map((item) => (
                  <li key={item.produtoId} className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block">
                        {item.quantidade}× {item.titulo}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {item.formato === "digital" ? "Material digital" : "Produto físico"}
                      </span>
                    </div>

                    <span className="shrink-0 tabular-nums">
                      {formatCurrency(item.valor * item.quantidade)}
                    </span>
                  </li>
                ))}
              </ul>

              <Separator className="my-4" />

              <div className="flex justify-between font-display text-lg font-bold">
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
