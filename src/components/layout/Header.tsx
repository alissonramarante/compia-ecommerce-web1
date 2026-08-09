import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingCart, User } from "lucide-react";
import { CompiaLogo } from "@/components/branding/CompiaLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/store/cart";
import categorias from "@/data/categorias.json";

function SearchBar({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  return (
    <form
      role="search"
      className="flex w-full items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(term ? `/produtos?q=${encodeURIComponent(term)}` : "/produtos");
        onDone?.();
      }}
    >
      <div className="relative w-full min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por título, categoria, tag ou SKU"
          aria-label="Buscar produtos"
          className="h-11 pl-9"
        />
      </div>
      <Button type="submit" className="h-11 shrink-0">
        Buscar
      </Button>
    </form>
  );
}

export function Header() {
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 py-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 md:gap-6">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-6">
                <SheetTitle className="sr-only">Menu de categorias</SheetTitle>
                <CompiaLogo className="h-12" />
                <nav className="mt-6 flex flex-col gap-1">
                  <Link
                    to="/produtos"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                  >
                    Todos os produtos
                  </Link>
                  {categorias.map((c) => (
                    <Link
                      key={c.id}
                      to={`/categoria/${c.slug}`}
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {c.nome}
                    </Link>
                  ))}
                  <Link
                    to="/minha-conta"
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                  >
                    Minha conta
                  </Link>
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                  >
                    Painel administrativo
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <CompiaLogo className="h-9 md:h-12" priority />
          </div>

          <div className="hidden md:block">
            <SearchBar />
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/minha-conta">
                <User className="size-4" />
                <span className="hidden lg:inline">Minha conta</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild className="relative">
              <Link to="/carrinho" aria-label={`Carrinho com ${totalItems} itens`}>
                <ShoppingCart className="size-5" />
                <span className="hidden lg:inline">Carrinho</span>
                {totalItems > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-3 md:hidden">
          <SearchBar />
        </div>
      </div>

      <nav className="hidden w-full bg-brand-ink md:block">
        <div className="mx-auto flex w-[90%] items-center justify-between py-1.5">
          <Link
            to="/produtos"
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-background/90 hover:bg-white/10"
          >
            Todos os produtos
          </Link>
          {categorias.map((c) => (
            <Link
              key={c.id}
              to={`/categoria/${c.slug}`}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-background/70 hover:bg-white/10 hover:text-background"
            >
              {c.nome}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
