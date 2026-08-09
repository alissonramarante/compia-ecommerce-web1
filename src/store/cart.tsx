import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Produto } from "@/types";

export interface CartItem {
  produto: Produto;
  quantidade: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  hasFisico: boolean;
  hasDigital: boolean;
  addItem: (produto: Produto, quantidade?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantidade: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "compia:carrinho";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {

    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const maxFor = (produto: Produto) =>
      produto.formato === "digital" ? 99 : produto.estoque;

    return {
      items,
      totalItems: items.reduce((sum, i) => sum + i.quantidade, 0),
      subtotal: items.reduce((sum, i) => sum + i.quantidade * i.produto.valor, 0),
      hasFisico: items.some((i) => i.produto.formato === "fisico"),
      hasDigital: items.some((i) => i.produto.formato === "digital"),
      addItem: (produto, quantidade = 1) => {
        if (produto.formato === "fisico" && produto.estoque <= 0) {
          toast.error("Produto esgotado.");
          return;
        }
        setItems((prev) => {
          const existing = prev.find((i) => i.produto.id === produto.id);
          const limite = maxFor(produto);
          if (existing) {
            const nova = Math.min(existing.quantidade + quantidade, limite);
            if (nova === existing.quantidade) {
              toast.warning(`Quantidade máxima disponível: ${limite}.`);
              return prev;
            }
            toast.success("Produto adicionado ao carrinho.");
            return prev.map((i) =>
              i.produto.id === produto.id ? { ...i, quantidade: nova } : i,
            );
          }
          toast.success("Produto adicionado ao carrinho.");
          return [...prev, { produto, quantidade: Math.min(quantidade, limite) }];
        });
      },
      removeItem: (id) => {
        setItems((prev) => prev.filter((i) => i.produto.id !== id));
        toast.success("Produto removido do carrinho.");
      },
      updateQuantity: (id, quantidade) => {
        setItems((prev) =>
          prev.map((i) => {
            if (i.produto.id !== id) return i;
            const limite = maxFor(i.produto);
            const nova = Math.max(1, Math.min(quantidade, limite));
            if (quantidade > limite) toast.warning(`Estoque disponível: ${limite}.`);
            return { ...i, quantidade: nova };
          }),
        );
      },
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de CartProvider");
  return ctx;
}
