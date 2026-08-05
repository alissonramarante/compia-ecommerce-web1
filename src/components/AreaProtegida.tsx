import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { ROTULO_DE_AREA, areasVisiveis, podeVer, type AreaAdmin } from '../lib/permissoes';
import { useSessao } from '../hooks/useSessao';

interface Props {
  /** Área exigida pela rota. Ausente cobre só a exigência de estar logado — é o caso do próprio /admin, que qualquer perfil da equipe acessa. */
  area?: AreaAdmin;
  children: ReactNode;
}

const CLASSE_TELA = 'mx-auto max-w-xl px-4 py-24 text-center md:px-6';
const CLASSE_TITULO = 'font-display text-2xl font-extrabold tracking-tight text-tinta';
const CLASSE_BOTAO =
  'mt-8 inline-block bg-azul px-5 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta';

/**
 * Guarda de rota do painel. Dois casos, cada um com tela própria — falhar
 * visivelmente, nunca redirecionar em silêncio:
 *
 *   1. Ninguém da equipe logado: pede o acesso, com link para /entrar.
 *   2. Logado, mas o perfil não alcança a área exigida: diz qual perfil está
 *      em uso e quais áreas ele alcança.
 *
 * Esconder o item de menu (LayoutAdmin) não substitui isto — é só a metade
 * visível. Quem digita o endereço direto ainda esbarra aqui.
 */
function AreaProtegida({ area, children }: Props) {
  const { usuarioCorrente } = useSessao();

  if (usuarioCorrente === null) {
    return (
      <div className={CLASSE_TELA}>
        <h1 className={CLASSE_TITULO}>Acesso restrito à equipe.</h1>
        <p className="mt-3 leading-relaxed text-grafite">
          Esta área é só para quem faz parte da equipe da editora. Entre com o
          e-mail cadastrado para continuar.
        </p>
        <Link to="/entrar" className={CLASSE_BOTAO}>
          Entrar
        </Link>
      </div>
    );
  }

  if (area !== undefined && !podeVer(usuarioCorrente.perfil, area)) {
    const alcancadas = areasVisiveis(usuarioCorrente.perfil);

    return (
      <div className={CLASSE_TELA}>
        <h1 className={CLASSE_TITULO}>Você não tem acesso a esta área.</h1>
        <p className="mt-3 leading-relaxed text-grafite">
          Seu perfil atual é{' '}
          <span className="font-mono text-sm uppercase tracking-wide text-tinta">
            {usuarioCorrente.perfil}
          </span>
          .{' '}
          {alcancadas.length === 0
            ? 'Ele não dá acesso a nenhuma área do painel.'
            : `Ele alcança: ${alcancadas.map((item) => ROTULO_DE_AREA[item]).join(', ')}.`}
        </p>
        <Link to="/admin" className="mt-8 inline-block font-display text-sm text-azul hover:underline">
          Voltar ao painel
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export default AreaProtegida;
