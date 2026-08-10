import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, MapPin, Package, Printer, QrCode, User } from "lucide-react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatCurrency, formatDate } from "@/lib/format";
import { useCustomers, useOrder } from "@/hooks/useCatalog";
import { orderService } from "@/services";
import type { PedidoStatus } from "@/types";

const STATUS_LABEL: Record<PedidoStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  preparacao: "Em preparação",
  enviado: "Enviado",
  entregue: "Entregue",
};

const STATUS_ORDEM: PedidoStatus[] = ["pendente", "aprovado", "preparacao", "enviado", "entregue"];

const STATUS_VARIANT: Record<PedidoStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "outline",
  aprovado: "secondary",
  preparacao: "secondary",
  enviado: "default",
  entregue: "default",
};

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pedido, isLoading } = useOrder(id);
  const { data: clientes } = useCustomers();

  const [status, setStatus] = useState<PedidoStatus | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (pedido) setStatus(pedido.status);
  }, [pedido]);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-muted-foreground">
          Carregando pedido...
        </div>
      </SiteLayout>
    );
  }

  if (!pedido) {
    return (
      <SiteLayout>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold">Pedido não encontrado</h1>
          <p className="text-muted-foreground">
            Não encontramos nenhum pedido com o código informado.
          </p>
          <Button asChild>
            <Link to="/admin/pedidos">Voltar para pedidos</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const clienteInfo = clientes?.find(
    (c) => c.nome.trim().toLowerCase() === pedido.cliente.trim().toLowerCase(),
  );

  const email = pedido.email ?? clienteInfo?.email;

  const statusAlterado = status !== null && status !== pedido.status;

  const salvarStatus = async () => {
    if (!status || !id) return;
    setSalvando(true);
    await orderService.updateOrderStatus(id, status);
    await queryClient.invalidateQueries({ queryKey: ["pedido", id] });
    await queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    setSalvando(false);
    toast.success("Status do pedido atualizado.");
    navigate("/admin/pedidos");
  };

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <Button variant="ghost" className="mb-4 -ml-2 print:hidden" onClick={() => navigate("/admin/pedidos")}>
          <ArrowLeft className="size-4" />
          Voltar para pedidos
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{pedido.id}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Realizado em {formatDate(pedido.data)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={STATUS_VARIANT[pedido.status]} className="w-fit text-sm">
              {STATUS_LABEL[pedido.status]}
            </Badge>

            <Button
              variant="outline"
              className="print:hidden"
              onClick={() => window.print()}
            >
              <Printer className="size-4" />
              Imprimir / Baixar PDF
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] print:grid-cols-1">
          <div className="space-y-6">
            <section className="surface-card p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <User className="size-4 text-primary" />
                Cliente
              </h2>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Nome</dt>
                  <dd className="font-medium">{pedido.cliente}</dd>
                </div>

                {email && (
                  <div>
                    <dt className="text-muted-foreground">E-mail</dt>
                    <dd className="font-medium">{email}</dd>
                  </div>
                )}

                {clienteInfo?.cpf && (
                  <div>
                    <dt className="text-muted-foreground">CPF/CNPJ</dt>
                    <dd className="font-medium">{clienteInfo.cpf}</dd>
                  </div>
                )}

                {clienteInfo && (
                  <div>
                    <dt className="text-muted-foreground">Cidade</dt>
                    <dd className="font-medium">
                      {clienteInfo.cidade}/{clienteInfo.estado}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {pedido.endereco && (
              <section className="surface-card p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <MapPin className="size-4 text-primary" />
                  Endereço de entrega
                </h2>

                <p className="mt-3 text-sm text-muted-foreground">{pedido.endereco}</p>
              </section>
            )}

            <section className="surface-card p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Package className="size-4 text-primary" />
                Itens do pedido
              </h2>

              <div className="mt-4 hidden overflow-x-auto sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Formato</TableHead>
                      <TableHead className="text-right">Qtd.</TableHead>
                      <TableHead className="text-right">Valor unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {pedido.itens.map((item) => (
                      <TableRow key={item.produtoId}>
                        <TableCell className="font-medium">{item.titulo}</TableCell>
                        <TableCell className="capitalize">{item.formato}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.quantidade}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(item.valor)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(item.valor * item.quantidade)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:hidden">
                {pedido.itens.map((item) => (
                  <div key={item.produtoId} className="rounded-lg border p-3">
                    <p className="font-medium">{item.titulo}</p>
                    <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                      <span className="capitalize">{item.formato}</span>
                      <span>{item.quantidade}×</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(item.valor)} cada
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(item.valor * item.quantidade)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <span className="font-display font-semibold">Total</span>
                <span className="font-display text-xl font-bold tabular-nums">
                  {formatCurrency(pedido.total)}
                </span>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="surface-card p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                {pedido.pagamento === "pix" ? (
                  <QrCode className="size-4 text-primary" />
                ) : (
                  <CreditCard className="size-4 text-primary" />
                )}
                Pagamento
              </h2>

              <p className="mt-3 text-sm">
                Forma:{" "}
                <span className="font-medium capitalize">
                  {pedido.pagamento === "pix" ? "PIX" : "Cartão de crédito"}
                </span>
              </p>

              {pedido.pagamento === "cartao" && pedido.parcelas && (
                <p className="mt-1 text-sm">
                  Parcelamento:{" "}
                  <span className="font-medium">
                    {pedido.parcelas === 1
                      ? "à vista"
                      : `${pedido.parcelas}x de ${formatCurrency(pedido.total / pedido.parcelas)}`}
                  </span>
                </p>
              )}
            </section>

            <section className="surface-card p-6 print:hidden">
              <h2 className="font-display text-lg font-semibold">Status do pedido</h2>

              <div className="mt-4">
                <Select
                  value={status ?? pedido.status}
                  onValueChange={(value) => setStatus(value as PedidoStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDEM.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="mt-4 w-full"
                disabled={!statusAlterado || salvando}
                onClick={() => void salvarStatus()}
              >
                {salvando ? "Salvando..." : "Atualizar status"}
              </Button>
            </section>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
