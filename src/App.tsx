import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/store/cart";
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/CatalogPage";
import CategoryPage from "@/pages/CategoryPage";
import ProductPage from "@/pages/ProductPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import AccountPage from "@/pages/AccountPage";
import OrderSuccessPage from "@/pages/OrderSuccessPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminProductsPage from "@/pages/AdminProductsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

const titles: Record<string, string> = {
  "/": "CompIA",
  "/produtos": "Catálogo de materiais | COMPIA",
  "/carrinho": "Carrinho | COMPIA",
  "/checkout": "Checkout | COMPIA",
  "/minha-conta": "Minha conta | COMPIA",
  "/pedido/sucesso": "Pedido confirmado | COMPIA",
  "/admin": "Painel administrativo | COMPIA",
  "/admin/produtos": "Gestão de produtos | COMPIA",
};

function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = titles[pathname]
      ?? (pathname.startsWith("/categoria/") ? "Categoria | COMPIA" : undefined)
      ?? (pathname.startsWith("/produtos/") ? "Produto | COMPIA" : undefined)
      ?? "CompIA";

    document.title = title;
  }, [pathname]);

  return null;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <BrowserRouter>
          <RouteMetadata />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/produtos" element={<CatalogPage />} />
            <Route path="/categoria/:slug" element={<CategoryPage />} />
            <Route path="/produtos/:id" element={<ProductPage />} />
            <Route path="/carrinho" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/minha-conta" element={<AccountPage />} />
            <Route path="/pedido/sucesso" element={<OrderSuccessPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/produtos" element={<AdminProductsPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-center" />
      </CartProvider>
    </QueryClientProvider>
  );
}
