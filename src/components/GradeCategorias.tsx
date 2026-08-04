import { Link } from 'react-router-dom';
import type { Categoria } from '../types';

interface Props {
  categorias: Categoria[];
  /** Indexado pelo id da categoria, como devolve `contarPorCategoria`. */
  contagemPorCategoria: Record<string, number>;
}

/** Visão `?visao=categorias`. Cada card leva ao catálogo já filtrado. */
function GradeCategorias({ categorias, contagemPorCategoria }: Props) {
  return (
    <ul className="grid gap-px border border-grafite/25 bg-grafite/25 sm:grid-cols-2 lg:grid-cols-3">
      {categorias.map((categoria) => {
        const total = contagemPorCategoria[categoria.id] ?? 0;

        return (
          <li key={categoria.id}>
            <Link
              to={`/catalogo?categoria=${categoria.slug}`}
              className="group flex h-full flex-col bg-white p-6 transition-colors hover:bg-papel"
            >
              <h2 className="font-display text-lg font-bold tracking-tight text-tinta group-hover:text-azul">
                {categoria.nome}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-grafite">
                {categoria.descricao}
              </p>
              <p className="mt-4 font-mono text-xs uppercase tracking-wide text-grafite">
                {total} {total === 1 ? 'título' : 'títulos'}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default GradeCategorias;
