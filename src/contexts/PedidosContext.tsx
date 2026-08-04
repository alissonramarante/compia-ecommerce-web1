import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import type { Pedido } from '../types';
import { pedidos as pedidosIniciais } from '../mocks';
import { carregarPedidos, salvar } from '../lib/pedidosArmazenados';

export interface EstadoPedidos {
  pedidos: Pedido[];
}

export type AcaoPedidos =
  | { tipo: 'adicionar'; pedido: Pedido }
  | { tipo: 'atualizar'; pedido: Pedido };

/**
 * Reducer puro: sem `localStorage`, sem relógio. A gravação vive no efeito.
 *
 * `adicionar` coloca o novo na frente — a lista é lida em ordem de "mais
 * recente primeiro", tanto na área do cliente quanto no painel.
 *
 * `atualizar` casa por `id` e não insere o que não existe: aplicar uma
 * atualização a um pedido apagado tem que ser inócuo, não ressuscitá-lo.
 */
export function reducerPedidos(estado: EstadoPedidos, acao: AcaoPedidos): EstadoPedidos {
  switch (acao.tipo) {
    case 'adicionar':
      return { pedidos: [acao.pedido, ...estado.pedidos] };

    case 'atualizar':
      return {
        pedidos: estado.pedidos.map((pedido) =>
          pedido.id === acao.pedido.id ? acao.pedido : pedido,
        ),
      };
  }
}

export function criarEstadoInicial(): EstadoPedidos {
  return { pedidos: carregarPedidos(pedidosIniciais) };
}

export interface ValorDosPedidos {
  pedidos: Pedido[];
  pedidoPorNumero: (numero: string) => Pedido | undefined;
  pedidosDoCliente: (clienteId: string) => Pedido[];
  adicionarPedido: (pedido: Pedido) => void;
  atualizarPedido: (pedido: Pedido) => void;
}

export const PedidosContext = createContext<ValorDosPedidos | null>(null);

interface Props {
  children: ReactNode;
}

function PedidosProvider({ children }: Props) {
  const [estado, despachar] = useReducer(reducerPedidos, undefined, criarEstadoInicial);

  /* Roda também na montagem, o que grava a semente dos mocks. A partir daí
     o armazenamento é a fonte, e um pedido novo não é engolido pela
     semente na próxima recarga. */
  useEffect(() => {
    salvar(estado.pedidos);
  }, [estado.pedidos]);

  const valor = useMemo<ValorDosPedidos>(
    () => ({
      pedidos: estado.pedidos,

      pedidoPorNumero: (numero) =>
        estado.pedidos.find((pedido) => pedido.numero === numero),

      pedidosDoCliente: (clienteId) =>
        estado.pedidos
          .filter((pedido) => pedido.clienteId === clienteId)
          .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),

      adicionarPedido: (pedido) => despachar({ tipo: 'adicionar', pedido }),
      atualizarPedido: (pedido) => despachar({ tipo: 'atualizar', pedido }),
    }),
    [estado.pedidos],
  );

  return <PedidosContext.Provider value={valor}>{children}</PedidosContext.Provider>;
}

export default PedidosProvider;
