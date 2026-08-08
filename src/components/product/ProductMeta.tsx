import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { disponibilidadeLabel, formatCurrency, getDisponibilidade } from "@/lib/format";
import type { Produto } from "@/types";
import { Download, Package } from "lucide-react";

export function Price({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("font-display text-xl font-bold tabular-nums", className)}>
      {formatCurrency(value)}
    </span>
  );
}

export function FormatBadge({ produto }: { produto: Produto }) {
  const digital = produto.formato === "digital";
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-transparent font-medium",
        digital ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground",
      )}
    >
      {digital ? <Download className="size-3" /> : <Package className="size-3" />}
      {digital ? "Entrega digital" : "Livro físico"}
    </Badge>
  );
}

export function StockBadge({ produto }: { produto: Produto }) {
  const status = getDisponibilidade(produto);
  if (produto.formato === "digital") {
    return (
      <span className="text-sm font-medium text-success">Entrega digital imediata</span>
    );
  }
  return (
    <span
      className={cn(
        "text-sm font-medium",
        status === "disponivel" && "text-success",
        status === "baixo" && "text-warning",
        status === "esgotado" && "text-destructive",
      )}
    >
      {disponibilidadeLabel[status]}
      {status === "baixo" ? ` — restam ${produto.estoque}` : ""}
    </span>
  );
}

export function Rating({ produto }: { produto: Produto }) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <span aria-hidden className="text-warning">
        {"★".repeat(Math.round(produto.avaliacao))}
        <span className="text-muted-foreground/40">
          {"★".repeat(5 - Math.round(produto.avaliacao))}
        </span>
      </span>
      <span>
        {produto.avaliacao.toFixed(1)} ({produto.avaliacoes})
      </span>
    </div>
  );
}
