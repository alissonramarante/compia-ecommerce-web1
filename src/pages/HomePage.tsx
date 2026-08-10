import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/button";
import { useCategories, useProducts } from "@/hooks/useCatalog";

export default function Home() {
  const { data: produtos, isLoading } = useProducts();
  const { data: categorias } = useCategories();
 
  const destaques = (produtos ?? []).filter((p) => p.destaque).slice(0, 8);
  const tendencias = (produtos ?? []).filter((p) => p.tendencia).slice(0, 4);

  return (
    <SiteLayout>
      <section className="hero-gradient text-background">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide">
              <Sparkles className="size-3.5" /> Editora tech &amp; ebooks
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] md:text-6xl">
              Conhecimento para a próxima geração de tecnologia.
            </h1>
            <p className="mt-5 max-w-xl text-base text-background/75 md:text-lg">
              Materiais bibliográficos e educacionais em Inteligência Artificial, arquitetura de
              software inteligente, blockchain, criptografia e cibersegurança — para instituições,
              pesquisadores, professores, estudantes e equipes de TI.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/produtos">
                  Explorar catálogo <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/30 bg-transparent text-background hover:bg-white/10 hover:text-background"
              >
                <Link to="/categoria/inteligencia-artificial">
                  Coleção de IA
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: BookOpen, titulo: "Livros e revistas", texto: "Edições impressas revisadas por especialistas." },
              { icon: Sparkles, titulo: "E-books", texto: "Entrega digital imediata após o pagamento." },
              { icon: GraduationCap, titulo: "Graduação e pós", texto: "Alinhado a ementas e linhas de pesquisa." },
              { icon: ShieldCheck, titulo: "Corporativo", texto: "Kits e trilhas para times de tecnologia." },
            ].map(({ icon: Icon, titulo, texto }) => (
              <div key={titulo} className="rounded-xl border border-white/15 bg-white/5 p-5">
                <Icon className="size-6 text-primary" />
                <h2 className="mt-3 font-display text-base font-semibold">{titulo}</h2>
                <p className="mt-1 text-sm text-background/70">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Navegue por categoria</h2>
        <p className="mt-2 text-muted-foreground">
          Do fundamento acadêmico à aplicação corporativa.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {(categorias ?? []).map((c) => (
            <Link
              key={c.id}
              to={`/categoria/${c.slug}`}
              className="surface-card group flex flex-col justify-between gap-6 p-5 transition-shadow hover:shadow-elevated"
            >
              <div>
                <h3 className="font-display text-base font-semibold">{c.nome}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.descricao}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                Ver materiais <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-secondary/50 py-16">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">Produtos em destaque</h2>
              <p className="mt-2 text-muted-foreground">Os títulos mais procurados da COMPIA.</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/produtos">Ver todo o catálogo</Link>
            </Button>
          </div>
          <div className="mt-8">
            {isLoading ? <ProductGridSkeleton /> : <ProductGrid produtos={destaques} />}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Tendências em tecnologia</h2>
        <p className="mt-2 text-muted-foreground">
          IA generativa, criptografia pós-quântica, segurança em nuvem e MLOps.
        </p>
        <div className="mt-8">
          {isLoading ? <ProductGridSkeleton count={4} /> : <ProductGrid produtos={tendencias} />}
        </div>
      </section>

      <section className="bg-brand-ink py-16 text-background">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="font-display text-2xl font-bold md:text-3xl">Sobre a COMPIA</h2> 
          </div>
          <div className="space-y-4 md:col-span-2">
            <p className="text-background/75">
              A COMPIA é uma editora especializada em materiais bibliográficos e educacionais
              voltados às fronteiras da computação. Publicamos com autores que atuam em pesquisa e
              indústria, conectando teoria acadêmica e prática profissional.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { n: "120+", l: "Instituições de ensino parceiras" },
                { n: "300+", l: "Pesquisadores e autores" },
                { n: "45k", l: "Profissionais de TI atendidos" },
              ].map((item) => (
                <div key={item.l} className="rounded-xl border border-white/15 bg-white/5 p-5">
                  <p className="font-display text-3xl font-bold text-primary">{item.n}</p>
                  <p className="mt-1 text-sm text-background/70">{item.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
