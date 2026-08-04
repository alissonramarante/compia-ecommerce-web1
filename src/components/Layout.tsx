import { Outlet } from 'react-router-dom';
import Cabecalho from './Cabecalho';
import Rodape from './Rodape';

/** Casca persistente: cabeçalho e rodapé ficam, o miolo troca por rota. */
function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-tinta focus:px-4 focus:py-2 focus:font-display focus:text-sm focus:text-papel"
      >
        Pular para o conteúdo
      </a>

      <Cabecalho />

      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>

      <Rodape />
    </div>
  );
}

export default Layout;
