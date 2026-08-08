import { Link } from "react-router-dom";
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
  const { data: produtos } = useProducts();
  const { data: pedidos } = useOrders();
  const { data: clientes } = useCustomers();

  const lista = produtos ?? [];
  const listaPedidos = pedidos ?? [];
  const receita = listaPedidos.reduce((sum, p) => sum + p.total, 0);
  const estoqueBaixo = lista.filter((p) => getDisponibilidade(p) !== "disponivel");

  const cards = [
    { label: "Receita simulada", valor: formatCurrency(receita), Icon: BarChart3 },
    { label: "Pedidos", valor: String(listaPedidos.length), Icon: ShoppingBag },
    { label: "Produtos ativos", valor: String(lista.length), Icon: Boxes },
    { label: "Clientes", valor: String((clientes ?? []).length), Icon: Users },
  ];

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold">Painel administrativo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Demonstração de gestão — dados locais, sem autenticação real.
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/produtos">Gerenciar produtos</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, valor, Icon }) => (
            <div key={label} className="surface-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="size-4 text-primary" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold tabular-nums">{valor}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <h2 className="font-display text-lg font-semibold">Pedidos recentes</h2>
            <div className="surface-card mt-4 overflow-x-auto p-0">
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
                    <TableRow key={pedido.id}>
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

          <aside>
            <h2 className="font-display text-lg font-semibold">Atenção no estoque</h2>
            <div className="surface-card mt-4 divide-y p-0">
              {estoqueBaixo.length === 0 && (
                <p className="p-5 text-sm text-muted-foreground">Todos os itens com estoque saudável.</p>
              )}
              {estoqueBaixo.map((produto) => (
                <div key={produto.id} className="flex items-center justify-between gap-3 p-4">
                  <span className="min-w-0 truncate text-sm">{produto.titulo}</span>
                  <Badge variant={produto.estoque === 0 ? "destructive" : "secondary"}>
                    {produto.estoque} un.
                  </Badge>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
