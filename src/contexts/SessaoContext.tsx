import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import type { Cliente, Usuario } from '../types';
import { clientes, usuarios } from '../mocks';
import { autenticarEquipe, buscarCliente, type ResultadoDeAcesso } from '../lib/sessao';
import { carregarSessao, salvar } from '../lib/sessaoArmazenada';

export interface EstadoSessao {
  clienteCorrente: Cliente;
  /** `null` fora do acesso da equipe. Serve ao /admin na Fatia 7. */
  usuarioCorrente: Usuario | null;
}

export type AcaoSessao =
  | { tipo: 'entrarComoCliente'; cliente: Cliente }
  | { tipo: 'entrarComoUsuario'; usuario: Usuario }
  | { tipo: 'sairDaEquipe' };

/** Reducer puro: sem `localStorage`, sem relógio, sem busca nos mocks. */
export function reducerSessao(estado: EstadoSessao, acao: AcaoSessao): EstadoSessao {
  switch (acao.tipo) {
    case 'entrarComoCliente':
      return { ...estado, clienteCorrente: acao.cliente };

    case 'entrarComoUsuario':
      return { ...estado, usuarioCorrente: acao.usuario };

    case 'sairDaEquipe':
      return { ...estado, usuarioCorrente: null };
  }
}

export function criarEstadoInicial(): EstadoSessao {
  const { cliente, usuario } = carregarSessao(clientes, usuarios);

  return { clienteCorrente: cliente, usuarioCorrente: usuario };
}

export interface ValorDaSessao {
  clienteCorrente: Cliente;
  usuarioCorrente: Usuario | null;
  /** Id desconhecido é ignorado: a loja nunca fica sem cliente corrente. */
  entrarComoCliente: (id: string) => void;
  /** Devolve o resultado para a página mostrar o erro já redigido. */
  entrarComoUsuario: (email: string) => ResultadoDeAcesso;
  sairDaEquipe: () => void;
}

export const SessaoContext = createContext<ValorDaSessao | null>(null);

interface Props {
  children: ReactNode;
}

function SessaoProvider({ children }: Props) {
  const [estado, despachar] = useReducer(reducerSessao, undefined, criarEstadoInicial);

  /* Só ids vão para o armazenamento. Roda também na montagem, o que grava
     de volta a sessão já resolvida — id inválido não sobrevive à primeira
     carga. */
  useEffect(() => {
    salvar({
      clienteId: estado.clienteCorrente.id,
      usuarioId: estado.usuarioCorrente?.id ?? null,
    });
  }, [estado.clienteCorrente, estado.usuarioCorrente]);

  const valor = useMemo<ValorDaSessao>(
    () => ({
      clienteCorrente: estado.clienteCorrente,
      usuarioCorrente: estado.usuarioCorrente,

      entrarComoCliente: (id) => {
        const cliente = buscarCliente(clientes, id);
        if (cliente === undefined) return;

        despachar({ tipo: 'entrarComoCliente', cliente });
      },

      entrarComoUsuario: (email) => {
        const resultado = autenticarEquipe(usuarios, email);
        if (resultado.ok) despachar({ tipo: 'entrarComoUsuario', usuario: resultado.usuario });

        return resultado;
      },

      sairDaEquipe: () => despachar({ tipo: 'sairDaEquipe' }),
    }),
    [estado.clienteCorrente, estado.usuarioCorrente],
  );

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export default SessaoProvider;
