import { useCallback, useEffect, useState } from "react";
import { shippingService } from "@/services";
import type { Frete } from "@/types";

const KEY = "compia:frete";

export interface ShippingSelection {
  cep: string;
  estado: string;
  nomeEstado: string;
  valor: number;
}

export function useShipping() {
  const [selection, setSelection] = useState<ShippingSelection | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setSelection(JSON.parse(raw) as ShippingSelection);
    } catch {
    }
  }, []);

  const persist = useCallback((value: ShippingSelection | null) => {
    setSelection(value);
    if (value) window.localStorage.setItem(KEY, JSON.stringify(value));
    else window.localStorage.removeItem(KEY);
  }, []);

  const calcular = useCallback(
    async (cep: string) => {
      setLoading(true);
      setErro(null);
      const frete: Frete | undefined = await shippingService.resolveCep(cep);
      setLoading(false);
      if (!frete) {
        setErro("CEP não encontrado na nossa tabela de demonstração.");
        persist(null);
        return null;
      }
      const value: ShippingSelection = {
        cep,
        estado: frete.estado,
        nomeEstado: frete.nome,
        valor: frete.valorFrete,
      };
      persist(value);
      return value;
    },
    [persist],
  );

  return { selection, loading, erro, calcular, limpar: () => persist(null) };
}
