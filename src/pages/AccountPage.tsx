import { Link } from "react-router-dom";
import { Download, Package } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { useDownloads, useOrders } from "@/hooks/useCatalog";
import type { PedidoStatus } from "@/types";

const statusLabel: Record<PedidoStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  preparacao: "Em preparação",
  enviado: "Enviado",
  entregue: "Entregue",
};

export default function MinhaConta() {
  const { data: pedidos, isLoading } = useOrders();
  const { data: downloads } = useDownloads();

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Minha conta</h1>
        <p className="mt-2 text-muted-foreground">
          Área de demonstração com pedidos e materiais digitais simulados.
        </p>

        <Tabs defaultValue="pedidos" className="mt-8">
          <TabsList>
            <TabsTrigger value="pedidos">
              <Package className="size-4" /> Pedidos
            </TabsTrigger>
            <TabsTrigger value="downloads">
              <Download className="size-4" /> Downloads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos" className="mt-6">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="surface-card overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(pedidos ?? []).map((pedido) => (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-medium">{pedido.id}</TableCell>
                        <TableCell>{formatDate(pedido.data)}</TableCell>
                        <TableCell className="max-w-[280px] truncate">
                          {pedido.itens.map((i) => i.titulo).join(", ")}
                        </TableCell>
                        <TableCell className="uppercase">{pedido.pagamento}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{statusLabel[pedido.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(pedido.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="downloads" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {(downloads ?? []).map((item) => (
                <article key={item.id} className="surface-card flex flex-col gap-2 p-5">
                  <h2 className="font-display text-base font-semibold">{item.titulo}</h2>
                  <p className="text-sm text-muted-foreground">
                    {item.formatoArquivo} · {item.tamanho} · liberado em {formatDate(item.liberadoEm)}
                  </p>
                  <p className="text-xs text-muted-foreground">Pedido {item.pedido}</p>
                  <Button asChild variant="secondary" className="mt-2 w-fit">
                    <a href={item.url} download>
                      <Download className="size-4" /> Baixar arquivo
                    </a>
                  </Button>
                </article>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-10">
          <Button asChild variant="ghost">
            <Link to="/produtos">Voltar ao catálogo</Link>
          </Button>
        </div>
      </div>
    </SiteLayout>
  );
}
