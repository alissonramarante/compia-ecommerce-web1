import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import type { Produto } from '../types';
import { produtos as produtosIniciais } from '../mocks';
import {
  baixarEstoque as baixarEstoqueDosItens,
  devolverEstoque as devolverEstoqueDosItens,
} from '../lib/produto';
import { carregarProdutos, salvar } from '../lib/produtosArmazenados';

export interface EstadoProdutos {
  produtos: Produto[];
}

export type AcaoProdutos =
  | { tipo: 'salvar'; produto: Produto }
  | { tipo: 'excluir'; produtoId: string }
  | { tipo: 'baixarEstoque'; itens: { produtoId: string; quantidade: number }[] }
  | { tipo: 'devolverEstoque'; itens: { produtoId: string; quantidade: number }[] };

/**
 * Reducer puro: sem `localStorage`, sem relógio.
 *
 * `salvar` faz upsert por `id` — substitui se já existir, acrescenta se for
 * novo. É o mesmo caminho para criar e editar (Tarefa 2): quem decide qual é
 * o caso é a presença do id, não uma flag separada.
 *
 * `baixarEstoque` e `devolverEstoque` delegam a `lib/produto.ts`, onde a
 * regra (nunca negativo, e-book intocado) é pura e testável sem React.
 * `devolverEstoque` existe para o cancelamento de pedido não despachado da
 * Tarefa 3 — ver `lib/statusPedido.ts`.
 */
export function reducerProdutos(estado: EstadoProdutos, acao: AcaoProdutos): EstadoProdutos {
  switch (acao.tipo) {
    case 'salvar': {
      const existe = estado.produtos.some((produto) => produto.id === acao.produto.id);

      return {
        produtos: existe
          ? estado.produtos.map((produto) =>
              produto.id === acao.produto.id ? acao.produto : produto,
            )
          : [...estado.produtos, acao.produto],
      };
    }

    case 'excluir':
      return { produtos: estado.produtos.filter((produto) => produto.id !== acao.produtoId) };

    case 'baixarEstoque':
      return { produtos: baixarEstoqueDosItens(estado.produtos, acao.itens) };

    case 'devolverEstoque':
      return { produtos: devolverEstoqueDosItens(estado.produtos, acao.itens) };
  }
}

export function criarEstadoInicial(): EstadoProdutos {
  return { produtos: carregarProdutos(produtosIniciais) };
}

export interface ValorDosProdutos {
  produtos: Produto[];
  produtoPorId: (id: string) => Produto | undefined;
  produtoPorSlug: (slug: string) => Produto | undefined;
  salvarProduto: (produto: Produto) => void;
  excluirProduto: (produtoId: string) => void;
  baixarEstoque: (itens: { produtoId: string; quantidade: number }[]) => void;
  devolverEstoque: (itens: { produtoId: string; quantidade: number }[]) => void;
}

export const ProdutosContext = createContext<ValorDosProdutos | null>(null);

interface Props {
  children: ReactNode;
}

function ProdutosProvider({ children }: Props) {
  const [estado, despachar] = useReducer(reducerProdutos, undefined, criarEstadoInicial);

  /* Roda também na montagem, o que grava a semente dos mocks. A partir daí
     o armazenamento é a fonte, e um produto criado ou editado no admin não é
     engolido pela semente na próxima recarga. */
  useEffect(() => {
    salvar(estado.produtos);
  }, [estado.produtos]);

  const valor = useMemo<ValorDosProdutos>(
    () => ({
      produtos: estado.produtos,

      produtoPorId: (id) => estado.produtos.find((produto) => produto.id === id),
      produtoPorSlug: (slug) => estado.produtos.find((produto) => produto.slug === slug),

      salvarProduto: (produto) => despachar({ tipo: 'salvar', produto }),
      excluirProduto: (produtoId) => despachar({ tipo: 'excluir', produtoId }),
      baixarEstoque: (itens) => despachar({ tipo: 'baixarEstoque', itens }),
      devolverEstoque: (itens) => despachar({ tipo: 'devolverEstoque', itens }),
    }),
    [estado.produtos],
  );

  return <ProdutosContext.Provider value={valor}>{children}</ProdutosContext.Provider>;
}

export default ProdutosProvider;
