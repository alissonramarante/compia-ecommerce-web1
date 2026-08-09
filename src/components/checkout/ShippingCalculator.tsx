import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCep, formatCurrency } from "@/lib/format";
import type { useShipping } from "@/hooks/useShipping";

interface Props {
  shipping: ReturnType<typeof useShipping>;
  compact?: boolean;
}

export function ShippingCalculator({ shipping, compact }: Props) {
  const [cep, setCep] = useState(shipping.selection?.cep ?? "");
  useEffect(() => {
    if (shipping.selection?.cep) {
      setCep(shipping.selection.cep);
    }
  }, [shipping.selection?.cep]);

  return (
    <div className={compact ? "" : "surface-card p-5"}>
      <div className="flex items-center gap-2">
        <Truck className="size-4 text-primary" />
        <h3 className="font-display text-sm font-semibold">Calcular frete</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground align-center">
        Informe o CEP para calcular o valor do frete.
      </p>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void shipping.calcular(cep);
        }}
      >
        <div className="w-full">
          <Label htmlFor="cep" className="sr-only">
            CEP
          </Label>
          <Input
            id="cep"
            inputMode="numeric"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => setCep(formatCep(e.target.value))}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={shipping.loading}>
          {shipping.loading ? "Calculando..." : "Calcular"}
        </Button>
      </form>

      {shipping.erro && <p className="mt-2 text-sm text-destructive">{shipping.erro}</p>}

      {shipping.selection && (
        <p className="mt-3 text-sm">
          Entrega para <strong>{shipping.selection.nomeEstado}</strong> ({shipping.selection.estado}):{" "}
          <strong>{formatCurrency(shipping.selection.valor)}</strong>
        </p>
      )}
    </div>
  );
}
