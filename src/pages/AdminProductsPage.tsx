import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { useCategories, useProducts } from "@/hooks/useCatalog";
import { productService } from "@/services";
import type { Produto } from "@/types";

const vazio = (id: number): Produto => ({
  id,
  titulo: "",
  descricao: "",
  valor: 0,
  estoque: 0,
  imagens: ["/images/placeholder-livro.jpg"],
  paginas: 100,
  formato: "fisico",
  sku: `COMPIA-${id}`,
  categoria: "",
  tags: [],
  avaliacao: 0,
  avaliacoes: 0,
});

export default function AdminProdutos() {
  const { data: produtos } = useProducts();
  const { data: categorias } = useCategories();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<Produto | null>(null);

  const lista = produtos ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["produtos"] });

  const salvar = async () => {
    if (!editando) return;
    if (editando.titulo.trim().length < 3 || editando.valor <= 0 || !editando.categoria) {
      toast.error("Preencha título, valor e categoria.");
      return;
    }
    await productService.saveProduct(editando);
    setEditando(null);
    await refresh();
    toast.success("Produto salvo.");
  };

  const remover = async (id: number) => {
    await productService.deleteProduct(id);
    await refresh();
    toast.success("Produto removido.");
  };

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold">Produtos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Alterações ficam salvas apenas neste navegador.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await productService.resetProducts();
                await refresh();
                toast.success("Catálogo restaurado.");
              }}
            >
              <RotateCcw className="size-4" /> Restaurar
            </Button>
            <Button onClick={() => setEditando(vazio(productService.nextId(lista)))}>
              <Plus className="size-4" /> Novo produto
            </Button>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:hidden">
          {lista.map((produto) => (
            <div key={produto.id} className="surface-card p-4">
              <div className="flex items-start justify-between gap-3">
                <Link
                  to={`/produtos/${String(produto.id)}`}
                  className="min-w-0 flex-1 truncate font-medium"
                >
                  {produto.titulo}
                </Link>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setEditando(produto)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover"
                    className="text-destructive"
                    onClick={() => void remover(produto.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {produto.categoria} · {produto.formato === "digital" ? "Digital" : "Físico"}
              </p>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {produto.formato === "digital" ? "—" : `${String(produto.estoque)} un. em estoque`}
                </span>
                <span className="tabular-nums font-semibold">{formatCurrency(produto.valor)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="surface-card mt-8 hidden overflow-x-auto p-0 sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell className="max-w-[280px] truncate font-medium">
                    <Link to={`/produtos/${String(produto.id)}`}>
                      {produto.titulo}
                    </Link>
                  </TableCell>
                  <TableCell>{produto.categoria}</TableCell>
                  <TableCell>{produto.formato === "digital" ? "Digital" : "Físico"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {produto.formato === "digital" ? "—" : produto.estoque}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(produto.valor)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setEditando(produto)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover"
                      className="text-destructive"
                      onClick={() => void remover(produto.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando?.titulo ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          {editando && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={editando.titulo}
                  onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={editando.descricao}
                  onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  min={0}
                  step="0.01"
                  value={editando.valor}
                  onChange={(e) => setEditando({ ...editando, valor: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="estoque">Estoque</Label>
                <Input
                  id="estoque"
                  type="number"
                  min={0}
                  value={editando.estoque}
                  onChange={(e) => setEditando({ ...editando, estoque: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="paginas">Páginas</Label>
                <Input
                  id="paginas"
                  type="number"
                  min={1}
                  value={editando.paginas}
                  onChange={(e) => setEditando({ ...editando, paginas: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={editando.sku}
                  onChange={(e) => setEditando({ ...editando, sku: e.target.value })}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={editando.categoria}
                  onValueChange={(value) => setEditando({ ...editando, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categorias ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.nome}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Formato</Label>
                <Select
                  value={editando.formato}
                  onValueChange={(value) =>
                    setEditando({ ...editando, formato: value as Produto["formato"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisico">Físico</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={editando.tags.join(", ")}
                  onChange={(e) =>
                    setEditando({
                      ...editando,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={() => void salvar()}>Salvar produto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
