import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import type { ItemCarrinho, Produto } from '../types';
import { produtos as produtosDosMocks } from '../mocks';
import {
  adicionarItem,
  alterarQuantidade,
  calcularSubtotal,
  contarItens,
  quantidadeMaxima,
  removerItem,
} from '../lib/carrinho';
import { carregarReconciliado, salvar } from '../lib/carrinhoArmazenado';
import { useSessao } from '../hooks/useSessao';
import { useProdutos } from '../hooks/useProdutos';

export interface Aviso {
  id: string;
  texto: string;
}

export interface EstadoCarrinho {
  /**
   * De quem é este carrinho. Fica no estado, e não só na sessão, porque é o
   * que garante que a gravação nunca use a chave de um cliente com os itens
   * de outro: os dois mudam na mesma ação.
   */
  clienteId: string;
  itens: ItemCarrinho[];
  avisos: Aviso[];
  /**
   * Contador de ids de aviso. Fica no estado porque o reducer é puro e não
   * pode sortear id nem ler o relógio; o índice do array não serve, porque
   * avisos são descartados fora de ordem.
   */
  sequenciaDeAvisos: number;
}

export type AcaoCarrinho =
  | { tipo: 'adicionar'; produto: Produto; quantidade: number }
  | { tipo: 'remover'; produtoId: string }
  | { tipo: 'alterar'; produto: Produto; quantidade: number }
  | { tipo: 'limpar' }
  | { tipo: 'descartarAviso'; id: string }
  | { tipo: 'avisar'; texto: string }
  | { tipo: 'trocarCliente'; clienteId: string; itens: ItemCarrinho[]; avisos: Aviso[] };

/**
 * Reducer puro: sem `localStorage`, sem relógio, sem aleatório. Só delega
 * para `lib/carrinho.ts`. Está exportado porque é testável sozinho, e é
 * onde as regras de limite não podem escapar.
 *
 * `trocarCliente` recebe os itens já lidos e reconciliados: quem toca no
 * armazenamento é o efeito, não o reducer.
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

    /* Aviso vindo de fora da reconciliação — hoje, o checkout abortado por
       troca de cliente. Texto já pronto: quem chama redige. */
    case 'avisar':
      return {
        ...estado,
        avisos: [
          ...estado.avisos,
          { id: `aviso-${estado.sequenciaDeAvisos}`, texto: acao.texto },
        ],
        sequenciaDeAvisos: estado.sequenciaDeAvisos + 1,
      };

    case 'trocarCliente':
      return {
        clienteId: acao.clienteId,
        itens: acao.itens,
        avisos: acao.avisos,
        sequenciaDeAvisos: acao.avisos.length,
      };
  }
}

/** Avisos da carga: o índice serve de id, porque nascem todos de uma vez. */
function comIds(textos: string[]): Aviso[] {
  return textos.map((texto, indice) => ({ id: `aviso-${indice}`, texto }));
}

/**
 * Carga inicial do cliente corrente.
 *
 * `produtos` tem o catálogo dos mocks como padrão para quem chama a função
 * fora do `<CarrinhoProvider>` — as suítes de teste, que reconciliam contra
 * o catálogo real. Em tempo de execução o provider passa o catálogo vivo do
 * `ProdutosContext`, para refletir estoque e preço já editados no admin.
 */
export function criarEstadoInicial(
  clienteId: string,
  produtos: Produto[] = produtosDosMocks,
): EstadoCarrinho {
  const { itens, avisos } = carregarReconciliado(produtos, clienteId);

  return {
    clienteId,
    itens,
    avisos: comIds(avisos),
    sequenciaDeAvisos: avisos.length,
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
  /** Empilha um aviso já redigido para aparecer no carrinho. */
  avisar: (texto: string) => void;
}

export const CarrinhoContext = createContext<ValorDoCarrinho | null>(null);

interface Props {
  children: ReactNode;
}

function CarrinhoProvider({ children }: Props) {
  const { clienteCorrente } = useSessao();
  const { produtos } = useProdutos();
  const [estado, despachar] = useReducer(
    reducerCarrinho,
    clienteCorrente.id,
    (clienteId) => criarEstadoInicial(clienteId, produtos),
  );

  /* Troca de cliente: carrega o carrinho do novo. A leitura acontece aqui,
     na fronteira, e o reducer só recebe o resultado pronto.
     Também dispara quando o catálogo muda com o mesmo cliente logado — é o
     que faz a reconciliação reagir a um estoque ou preço editado no admin
     enquanto o carrinho de outro cliente está aberto. */
  useEffect(() => {
    if (estado.clienteId === clienteCorrente.id) return;

    const { itens, avisos } = carregarReconciliado(produtos, clienteCorrente.id);
    despachar({
      tipo: 'trocarCliente',
      clienteId: clienteCorrente.id,
      itens,
      avisos: comIds(avisos),
    });
  }, [clienteCorrente.id, estado.clienteId, produtos]);

  /* Grava sempre sob a chave do dono guardado no estado, nunca sob a da
     sessão: no render em que o cliente muda, o estado ainda é o do anterior,
     e é exatamente onde os itens dele pertencem. */
  useEffect(() => {
    salvar(estado.clienteId, estado.itens);
  }, [estado.clienteId, estado.itens]);

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
      avisar: (texto) => despachar({ tipo: 'avisar', texto }),
    }),
    [estado.itens, estado.avisos],
  );

  return <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>;
}

export default CarrinhoProvider;
