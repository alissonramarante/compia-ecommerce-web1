import type { Disponibilidade, Produto } from "@/types";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatDate = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00`) : value;
  return new Intl.DateTimeFormat("pt-BR").format(date);
};

export const formatPages = (pages: number) => `${pages} páginas`;

export const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

export const formatCpf = (value: string) => {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
};

export const getDisponibilidade = (produto: Produto): Disponibilidade => {
  if (produto.formato === "digital") return "disponivel";
  if (produto.estoque <= 0) return "esgotado";
  if (produto.estoque <= 5) return "baixo";
  return "disponivel";
};

export const disponibilidadeLabel: Record<Disponibilidade, string> = {
  disponivel: "Em estoque",
  baixo: "Estoque baixo",
  esgotado: "Produto esgotado",
};

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
