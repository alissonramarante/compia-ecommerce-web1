import { Link, NavLink, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import { ROTULO_DE_AREA, areasVisiveis, type AreaAdmin } from '../lib/permissoes';
import { useSessao } from '../hooks/useSessao';
import { useLogs } from '../hooks/useLogs';

const ROTA_DA_AREA: Record<AreaAdmin, string> = {
  produtos: '/admin/produtos',
  pedidos: '/admin/pedidos',
  clientes: '/admin/clientes',
  logs: '/admin/logs',
};

const CLASSE_LINK_DE_AREA =
  'block py-2 font-display text-sm tracking-tight transition-colors';

/**
 * Casca do painel administrativo. Visualmente parente da loja — mesmos
 * tokens, mesma tipografia — mas com navegação própria: só as áreas que o
 * perfil alcança aparecem no menu.
 *
 * Esconder aqui é conveniência de navegação, não proteção: quem digita o
 * endereço de uma área escondida ainda esbarra em `AreaProtegida`.
 */
function LayoutAdmin() {
  const { usuarioCorrente, sairDaEquipe } = useSessao();
  const { registrarLog } = useLogs();

  // AreaProtegida (sem `area`) já garante isto antes de LayoutAdmin renderizar.
  if (usuarioCorrente === null) return null;

  const areas = areasVisiveis(usuarioCorrente.perfil);

  const aoSair = () => {
    registrarLog(
      {
        usuarioId: usuarioCorrente.id,
        acao: 'logout',
        entidade: 'usuario',
        entidadeId: usuarioCorrente.id,
        descricao: `${usuarioCorrente.nome} saiu do painel administrativo.`,
      },
      new Date().toISOString(),
    );
    sairDaEquipe();
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:px-6">
      <aside className="shrink-0 md:w-56">
        <p className="font-display text-lg font-extrabold uppercase tracking-tight text-tinta">
          Painel
        </p>

        <nav aria-label="Áreas do painel" className="mt-6 border-t border-grafite/20 pt-4">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `${CLASSE_LINK_DE_AREA} ${isActive ? 'text-azul' : 'text-tinta hover:text-azul'}`
                }
              >
                Visão geral
              </NavLink>
            </li>
            {areas.map((area) => (
              <li key={area}>
                <NavLink
                  to={ROTA_DA_AREA[area]}
                  className={({ isActive }) =>
                    `${CLASSE_LINK_DE_AREA} ${isActive ? 'text-azul' : 'text-tinta hover:text-azul'}`
                  }
                >
                  {ROTULO_DE_AREA[area]}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 border-t border-grafite/20 pt-4">
          <p className="text-sm text-tinta">{usuarioCorrente.nome}</p>
          <p className="font-mono text-xs uppercase tracking-wide text-grafite">
            {usuarioCorrente.perfil}
          </p>
          <button
            type="button"
            onClick={aoSair}
            className="mt-3 flex items-center gap-2 font-display text-sm text-azul hover:underline"
          >
            <LogOut size={14} strokeWidth={1.75} aria-hidden="true" />
            Sair
          </button>
        </div>

        <Link to="/" className="mt-8 block font-mono text-xs text-grafite hover:text-tinta">
          ← Voltar à loja
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

export default LayoutAdmin;
