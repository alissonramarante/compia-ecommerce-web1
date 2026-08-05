import { useContext } from 'react';
import { ProdutosContext, type ValorDosProdutos } from '../contexts/ProdutosContext';

/** Acesso ao catálogo. Só páginas chamam; componentes recebem props. */
export function useProdutos(): ValorDosProdutos {
  const valor = useContext(ProdutosContext);

  if (valor === null) {
    throw new Error(
      'useProdutos foi chamado fora do <ProdutosProvider>. Envolva as rotas com ele em App.tsx.',
    );
  }

  return valor;
}
