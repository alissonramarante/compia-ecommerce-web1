import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, ShoppingBag, X } from 'lucide-react';

/**
 * "Categorias" ainda não tem rota própria na especificação: as categorias são
 * um filtro do catálogo. O item aponta para o catálogo com um parâmetro que a
 * Fatia 2 vai ler, e é isso que mantém os dois itens distinguíveis aqui.
 */
const navegacao = [
  { rotulo: 'Catálogo', destino: '/catalogo' },
  { rotulo: 'Categorias', destino: '/catalogo?visao=categorias' },
  { rotulo: 'Conta', destino: '/conta' },
];

/** Fatia 1 não tem carrinho ainda; o contador nasce zerado. */
const QUANTIDADE_NO_CARRINHO = 0;

function Cabecalho() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { pathname, search } = useLocation();
  const rotaAtual = `${pathname}${search}`;

  const classeDoLink = (ativo: boolean) =>
    [
      'font-display text-sm tracking-tight transition-colors',
      ativo ? 'text-azul' : 'text-tinta hover:text-azul',
    ].join(' ');

  return (
    <header className="border-b border-grafite/30 bg-papel">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 md:px-6">
        {/* Logo */}
        <Link
          to="/"
          className="font-display text-xl font-extrabold uppercase tracking-tight text-tinta"
          onClick={() => setMenuAberto(false)}
        >
          COMPIA
          <span className="ml-2 font-mono text-[10px] font-normal uppercase tracking-widest text-grafite">
            editora
          </span>
        </Link>

        {/* Navegação — 768px para cima */}
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {navegacao.map((item) => (
              <li key={item.rotulo}>
                <NavLink to={item.destino} className={classeDoLink(item.destino === rotaAtual)}>
                  {item.rotulo}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {/* Carrinho */}
          <Link
            to="/carrinho"
            className="flex items-center gap-2 px-2 py-1 text-tinta transition-colors hover:text-azul"
            aria-label={`Carrinho, ${QUANTIDADE_NO_CARRINHO} itens`}
            onClick={() => setMenuAberto(false)}
          >
            <ShoppingBag size={20} strokeWidth={1.75} aria-hidden="true" />
            <span
              aria-hidden="true"
              className="min-w-[1.5rem] border border-grafite/40 px-1 py-px text-center font-mono text-xs leading-5 text-grafite"
            >
              {QUANTIDADE_NO_CARRINHO}
            </span>
          </Link>

          {/* Hambúrguer — abaixo de 768px */}
          <button
            type="button"
            className="p-2 text-tinta md:hidden"
            aria-expanded={menuAberto}
            aria-controls="menu-movel"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            {menuAberto ? (
              <X size={22} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Menu size={22} strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Painel do menu móvel */}
      {menuAberto && (
        <nav
          id="menu-movel"
          aria-label="Principal (móvel)"
          className="border-t border-grafite/30 bg-papel md:hidden"
        >
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {navegacao.map((item) => (
              <li key={item.rotulo} className="border-b border-grafite/20 last:border-b-0">
                <NavLink
                  to={item.destino}
                  onClick={() => setMenuAberto(false)}
                  className={`block py-3 ${classeDoLink(item.destino === rotaAtual)}`}
                >
                  {item.rotulo}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

export default Cabecalho;
