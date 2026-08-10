import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, Menu, Search, ShoppingCart, User } from "lucide-react";
import { CompiaLogo } from "@/components/branding/CompiaLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { useCart } from "@/store/cart";
import categorias from "@/data/categorias.json";

function SearchBar({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    navigate(term ? `/produtos?q=${encodeURIComponent(term)}` : "/produtos");

    onDone?.();
  }

  return (
    <form role="search" className="flex w-full items-center gap-2" onSubmit={handleSubmit}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por título, categoria, tag ou SKU"
          aria-label="Buscar produtos"
          className="h-11 pl-9"
        />
      </div>

      <Button type="submit" className="h-11">
        Buscar
      </Button>
    </form>
  );
}

export function Header() {
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full border-b bg-background print:hidden">
      <div className="mx-auto w-[90%]">
        <div className="grid grid-cols-3 items-center py-3 md:flex md:gap-6">
          <div className="justify-self-start md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="left">
                <SheetTitle>Menu de categorias</SheetTitle>

                <div className="mt-6 flex flex-col gap-1">
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="justify-self-center md:order-1">
            <CompiaLogo />
          </div>
          <div className="hidden flex-1 md:order-2 md:block">
            <SearchBar />
          </div>
          <div className="flex items-center justify-self-end gap-1 md:order-3">
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
            <Button variant="ghost" asChild>
              <Link to="/admin" aria-label="Painel administrativo">
                <Settings className="size-5" />
                <span className="hidden lg:inline">Administração</span>
              </Link>
            </Button>
          </div>
        </div>
        <div className="pb-3 md:hidden">
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
