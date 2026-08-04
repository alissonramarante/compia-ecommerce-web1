import { useContext } from 'react';
import { SessaoContext, type ValorDaSessao } from '../contexts/SessaoContext';

/** Acesso à sessão. Só páginas e o cabeçalho chamam; componentes recebem props. */
export function useSessao(): ValorDaSessao {
  const valor = useContext(SessaoContext);

  if (valor === null) {
    throw new Error(
      'useSessao foi chamado fora do <SessaoProvider>. Envolva as rotas com ele em App.tsx.',
    );
  }

  return valor;
}
