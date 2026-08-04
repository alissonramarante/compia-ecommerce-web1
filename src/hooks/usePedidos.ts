import { useContext } from 'react';
import { PedidosContext, type ValorDosPedidos } from '../contexts/PedidosContext';

/** Acesso aos pedidos. Só páginas chamam; componentes recebem props. */
export function usePedidos(): ValorDosPedidos {
  const valor = useContext(PedidosContext);

  if (valor === null) {
    throw new Error(
      'usePedidos foi chamado fora do <PedidosProvider>. Envolva as rotas com ele em App.tsx.',
    );
  }

  return valor;
}
