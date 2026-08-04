import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import type { ItemCarrinho, Produto } from '../types';
import { produtos } from '../mocks';
import {
  adicionarItem,
  alterarQuantidade,
  calcularSubtotal,
  contarItens,
  quantidadeMaxima,
  removerItem,
} from '../lib/carrinho';
import { carregarReconciliado, salvar } from '../lib/carrinhoArmazenado';

export interface Aviso {
  id: string;
  texto: string;
}

export interface EstadoCarrinho {
  itens: ItemCarrinho[];
  avisos: Aviso[];
}

export type AcaoCarrinho =
  | { tipo: 'adicionar'; produto: Produto; quantidade: number }
  | { tipo: 'remover'; produtoId: string }
  | { tipo: 'alterar'; produto: Produto; quantidade: number }
  | { tipo: 'limpar' }
  | { tipo: 'descartarAviso'; id: string };

/**
 * Reducer puro: sem `localStorage`, sem relógio, sem aleatório. Só delega
 * para `lib/carrinho.ts`. Está exportado porque é testável sozinho, e é
 * onde as regras de limite não podem escapar.
 *
 * O teto de quantidade é aplicado aqui, e não em `alterarQuantidade`, porque
 * a função da lib não recebe o produto e portanto não conhece o estoque.
 */
export function reducerCarrinho(
  estado: EstadoCarrinho,
  acao: AcaoCarrinho,
): EstadoCarrinho {
  switch (acao.tipo) {
    case 'adicionar':
      return {
        ...estado,
        itens: adicionarItem(estado.itens, acao.produto, acao.quantidade),
      };

    case 'remover':
      return { ...estado, itens: removerItem(estado.itens, acao.produtoId) };

    case 'alterar': {
      const maximo = quantidadeMaxima(acao.produto);
      const limitada = Math.min(acao.quantidade, maximo);

      return {
        ...estado,
        itens: alterarQuantidade(estado.itens, acao.produto.id, limitada),
      };
    }

    case 'limpar':
      return { ...estado, itens: [] };

    case 'descartarAviso':
      return {
        ...estado,
        avisos: estado.avisos.filter((aviso) => aviso.id !== acao.id),
      };
  }
}

/**
 * Carga inicial, uma vez só. Os avisos nascem aqui e não são produzidos
 * depois, então o índice serve de id estável.
 */
export function criarEstadoInicial(): EstadoCarrinho {
  const { itens, avisos } = carregarReconciliado(produtos);

  return {
    itens,
    avisos: avisos.map((texto, indice) => ({ id: `aviso-${indice}`, texto })),
  };
}

export interface ValorDoCarrinho {
  itens: ItemCarrinho[];
  quantidadeTotal: number;
  subtotal: number;
  avisos: Aviso[];
  adicionar: (produto: Produto, quantidade: number) => void;
  remover: (produtoId: string) => void;
  alterarQuantidade: (produto: Produto, quantidade: number) => void;
  limpar: () => void;
  descartarAviso: (id: string) => void;
}

export const CarrinhoContext = createContext<ValorDoCarrinho | null>(null);

interface Props {
  children: ReactNode;
}

function CarrinhoProvider({ children }: Props) {
  const [estado, despachar] = useReducer(reducerCarrinho, undefined, criarEstadoInicial);

  /* A escrita vive fora do reducer. Roda também na montagem, o que grava de
     volta o carrinho já reconciliado — o que estava velho no armazenamento
     não sobrevive ao primeiro carregamento. */
  useEffect(() => {
    salvar(estado.itens);
  }, [estado.itens]);

  const valor = useMemo<ValorDoCarrinho>(
    () => ({
      itens: estado.itens,
      quantidadeTotal: contarItens(estado.itens),
      subtotal: calcularSubtotal(estado.itens),
      avisos: estado.avisos,
      adicionar: (produto, quantidade) =>
        despachar({ tipo: 'adicionar', produto, quantidade }),
      remover: (produtoId) => despachar({ tipo: 'remover', produtoId }),
      alterarQuantidade: (produto, quantidade) =>
        despachar({ tipo: 'alterar', produto, quantidade }),
      limpar: () => despachar({ tipo: 'limpar' }),
      descartarAviso: (id) => despachar({ tipo: 'descartarAviso', id }),
    }),
    [estado.itens, estado.avisos],
  );

  return <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>;
}

export default CarrinhoProvider;
