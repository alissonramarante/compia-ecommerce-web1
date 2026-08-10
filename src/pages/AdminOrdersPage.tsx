import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatCurrency, formatDate } from "@/lib/format";
import { useOrders } from "@/hooks/useCatalog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Pedido, PedidoStatus } from "@/types";

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

type Periodo = "todos" | "hoje" | "semana" | "mes";
type StatusFiltro = "todos" | PedidoStatus;

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "hoje", label: "Hoje" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
];

const parseData = (value: string) => new Date(value.includes("T") ? value : `${value}T12:00:00`);

const dentroDoPeriodo = (pedido: Pedido, periodo: Periodo, agora: Date): boolean => {
  if (periodo === "todos") return true;

  const data = parseData(pedido.data);
  if (Number.isNaN(data.getTime())) return false;

  if (periodo === "hoje") {
    return (
      data.getFullYear() === agora.getFullYear() &&
      data.getMonth() === agora.getMonth() &&
      data.getDate() === agora.getDate()
    );
  }

  if (periodo === "semana") {
    const seteDiasAtras = new Date(agora);
    seteDiasAtras.setDate(agora.getDate() - 7);
    return data >= seteDiasAtras && data <= agora;
  }

  // mes
  return data.getFullYear() === agora.getFullYear() && data.getMonth() === agora.getMonth();
};

export default function AdminOrders() {
  const navigate = useNavigate();
  const { data: pedidos, isLoading } = useOrders();
  const [periodo, setPeriodo] = useState<Periodo>("todos");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos");

  const todosPedidos = pedidos ?? [];

  const lista = useMemo(() => {
    const agora = new Date();
    return todosPedidos.filter(
      (pedido) =>
        dentroDoPeriodo(pedido, periodo, agora) &&
        (statusFiltro === "todos" || pedido.status === statusFiltro),
    );
  }, [todosPedidos, periodo, statusFiltro]);

  const totalValor = lista.reduce((soma, pedido) => soma + pedido.total, 0);

  const contagemPorStatus = useMemo(() => {
    const contagem = new Map<PedidoStatus, number>();
    lista.forEach((pedido) => {
      contagem.set(pedido.status, (contagem.get(pedido.status) ?? 0) + 1);
    });
    return contagem;
  }, [lista]);

  const resumoStatus = STATUS_ORDEM.filter((status) => (contagemPorStatus.get(status) ?? 0) > 0)
    .map((status) => `${contagemPorStatus.get(status)} ${STATUS_LABEL[status]}`)
    .join(" - ");

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate("/admin")}>
          <ArrowLeft className="size-4" />
          Painel administrativo
        </Button>

        <div>
          <h1 className="font-display text-3xl font-bold">Pedidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe e atualize o status de cada pedido.
          </p>
        </div>

        <div className="surface-card mt-6 p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="font-display text-xl font-bold">
              {lista.length} {lista.length === 1 ? "Pedido" : "Pedidos"}
            </span>

            <span className="font-display text-lg font-semibold">
              Total: <span className="tabular-nums">{formatCurrency(totalValor)}</span>
            </span>
          </div>

          {resumoStatus ? (
            <p className="mt-2 text-sm text-muted-foreground">{resumoStatus}</p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Nenhum pedido com este filtro.</p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {PERIODOS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPeriodo(id)}
                className={
                  periodo === id
                    ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                    : "rounded-full border px-4 py-1.5 text-sm text-muted-foreground"
                }
              >
                {label}
              </button>
            ))}
          </div>

          <Select
            value={statusFiltro}
            onValueChange={(value) => setStatusFiltro(value as StatusFiltro)}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS_ORDEM.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && <p className="mt-8 text-sm text-muted-foreground">Carregando pedidos...</p>}

        <div className="mt-8 flex flex-col gap-3 sm:hidden">
          {lista.map((pedido) => (
            <Link
              key={pedido.id}
              to={`/admin/pedidos/${pedido.id}`}
              className="surface-card block p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate font-medium">{pedido.id}</span>
                <Badge variant={STATUS_VARIANT[pedido.status]} className="shrink-0">
                  {STATUS_LABEL[pedido.status]}
                </Badge>
              </div>

              <p className="mt-1 truncate text-sm text-muted-foreground">{pedido.cliente}</p>

              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{formatDate(pedido.data)}</span>
                <span className="shrink-0 tabular-nums font-semibold">
                  {formatCurrency(pedido.total)}
                </span>
              </div>
            </Link>
          ))}

          {!isLoading && lista.length === 0 && (
            <p className="surface-card p-5 text-sm text-muted-foreground">
              Nenhum pedido encontrado com os filtros atuais.
            </p>
          )}
        </div>

        <div className="surface-card mt-8 hidden overflow-x-auto p-0 sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {lista.map((pedido) => (
                <TableRow
                  key={pedido.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => navigate(`/admin/pedidos/${pedido.id}`)}
                >
                  <TableCell className="font-medium">{pedido.id}</TableCell>

                  <TableCell>{pedido.cliente}</TableCell>

                  <TableCell>{formatDate(pedido.data)}</TableCell>

                  <TableCell className="capitalize">{pedido.pagamento}</TableCell>

                  <TableCell>
                    <Badge variant={STATUS_VARIANT[pedido.status]}>
                      {STATUS_LABEL[pedido.status]}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(pedido.total)}
                  </TableCell>
                </TableRow>
              ))}

              {!isLoading && lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    Nenhum pedido encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </SiteLayout>
  );
}