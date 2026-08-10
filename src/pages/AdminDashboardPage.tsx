import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Boxes, ShoppingBag, Users } from "lucide-react";

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

import { formatCurrency, formatDate, getDisponibilidade } from "@/lib/format";

import { useCustomers, useOrders, useProducts } from "@/hooks/useCatalog";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: produtos } = useProducts();
  const { data: pedidos } = useOrders();
  const { data: clientes } = useCustomers();

  const lista = produtos ?? [];
  const listaPedidos = pedidos ?? [];

  const receita = listaPedidos.reduce((sum, p) => sum + p.total, 0);

  const estoqueBaixo = lista.filter((p) => getDisponibilidade(p) !== "disponivel");

  const cards = [
    {
      label: "Total de vendas",
      valor: formatCurrency(receita),
      Icon: BarChart3,
    },
    {
      label: "Pedidos",
      valor: String(listaPedidos.length),
      Icon: ShoppingBag,
      to: "/admin/pedidos",
    },
    {
      label: "Produtos",
      valor: String(lista.length),
      Icon: Boxes,
      to: "/admin/produtos",
    },
    {
      label: "Clientes",
      valor: String((clientes ?? []).length),
      Icon: Users,
    },
  ];

  return (
    <SiteLayout>
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Painel administrativo</h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Demonstração de gestão — dados locais, sem autenticação real.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/admin/produtos">Gerenciar produtos</Link>
            </Button>
          </div>
        </div>
        <div className="mt-8 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, valor, Icon, to }) => {
            const card = (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>

                  <Icon className="size-5 text-primary" />
                </div>

                <p className="mt-4 font-display text-2xl font-bold">{valor}</p>
              </>
            );

            if (to) {
              return (
                <Link
                  key={label}
                  to={to}
                  className="surface-card block p-5 transition-shadow hover:shadow-elevated"
                >
                  {card}
                </Link>
              );
            }

            return (
              <div key={label} className="surface-card p-5">
                {card}
              </div>
            );
          })}
        </div>
        <div className="mt-10 grid w-full min-w-0 gap-8 lg:grid-cols-2">
          <section className="w-full min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">Pedidos recentes</h2>
              <Link
                to="/admin/pedidos"
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver todos
              </Link>
            </div>
            <div className="mt-4 flex w-full flex-col gap-3 sm:hidden">
              {listaPedidos.slice(0, 8).map((pedido) => (
                <Link
                  key={pedido.id}
                  to={`/admin/pedidos/${pedido.id}`}
                  className="surface-card block w-full p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium">{pedido.id}</span>

                    <Badge variant="secondary" className="shrink-0">
                      {pedido.status}
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
            </div>
            <div className="surface-card mt-4 hidden w-full min-w-0 overflow-x-auto p-0 sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {listaPedidos.slice(0, 8).map((pedido) => (
                    <TableRow
                      key={pedido.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/pedidos/${pedido.id}`)}
                    >
                      <TableCell className="font-medium">{pedido.id}</TableCell>

                      <TableCell>{pedido.cliente}</TableCell>

                      <TableCell>{formatDate(pedido.data)}</TableCell>

                      <TableCell>
                        <Badge variant="secondary">{pedido.status}</Badge>
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(pedido.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
          <aside className="w-full min-w-0">
            <h2 className="font-display text-lg font-semibold">Atenção no estoque</h2>

            <div className="surface-card mt-4 w-full divide-y p-0">
              {estoqueBaixo.length === 0 && (
                <p className="p-5 text-sm text-muted-foreground">
                  Todos os itens com estoque saudável.
                </p>
              )}

              {estoqueBaixo.map((produto) => (
                <div
                  key={produto.id}
                  className="flex w-full items-center justify-between gap-3 p-4"
                >
                  <span className="min-w-0 truncate text-sm">{produto.titulo}</span>

                  <Badge
                    variant={produto.estoque === 0 ? "destructive" : "secondary"}
                    className="shrink-0"
                  >
                    {produto.estoque} un.
                  </Badge>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </SiteLayout>
  );
}
