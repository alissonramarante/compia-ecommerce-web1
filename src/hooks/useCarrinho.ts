import { useContext } from 'react';
import { CarrinhoContext, type ValorDoCarrinho } from '../contexts/CarrinhoContext';

/** Acesso ao carrinho. Só páginas e o cabeçalho chamam; componentes recebem props. */
export function useCarrinho(): ValorDoCarrinho {
  const valor = useContext(CarrinhoContext);

  if (valor === null) {
    throw new Error(
      'useCarrinho foi chamado fora do <CarrinhoProvider>. Envolva as rotas com ele em App.tsx.',
    );
  }

  return valor;
}
