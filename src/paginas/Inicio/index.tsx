import { Link } from 'react-router-dom';

/** Vitrine. Na Fatia 1 é só o hero tipográfico — a grade vem na Fatia 2. */
function Inicio() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 md:px-6 md:py-32">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-grafite">
        Editora técnica · Campina Grande, PB
      </p>

      <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-tinta md:text-7xl">
        COMPIA Editora
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-relaxed text-grafite md:text-xl">
        Livros, e-books, revistas e kits sobre inteligência artificial, editados no Brasil
        com o rigor de quem publica material técnico.
      </p>

      <Link
        to="/catalogo"
        className="mt-10 inline-block bg-azul px-6 py-3 font-display text-sm font-semibold tracking-tight text-papel transition-colors hover:bg-tinta"
      >
        Ver catálogo
      </Link>
    </section>
  );
}

export default Inicio;
