import { Link } from "react-router-dom";
import { CompiaLogo } from "@/components/branding/CompiaLogo";
import categorias from "@/data/categorias.json";

export function Footer() {
  return (
    <footer className="bg-brand-ink text-background">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="inline-block rounded-lg bg-background p-3">
            <CompiaLogo className="h-14" />
          </div>
          <p className="mt-4 max-w-sm text-sm text-background/70">
            COMPIA — Conhecimento, tecnologia e inovação para a próxima geração.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-background">
            Catálogo
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-background/70">
            {categorias.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link to={`/categoria/${c.slug}`}
                  className="hover:text-background"
                >
                  {c.nome}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-background">
            Institucional
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-background/70">
            <li>
              <Link to="/produtos" className="hover:text-background">
                Todos os produtos
              </Link>
            </li>
            <li>
              <Link to="/minha-conta" className="hover:text-background">
                Minha conta
              </Link>
            </li>
            <li>
              <Link to="/minha-conta#downloads" className="hover:text-background">
                Meus downloads
              </Link>
            </li>
            <li>
              <Link to="/admin" className="hover:text-background">
                Painel administrativo
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-7xl px-4 py-6 text-xs text-background/50 align-center flex justify-center" >
          © {new Date().getFullYear()} COMPIA Editora Tech &amp; Ebooks. Demonstração com dados
          fictícios — nenhum pagamento é processado.
        </p>
      </div>
    </footer>
  );
}
