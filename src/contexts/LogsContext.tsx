import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import type { LogAtividade } from '../types';
import { logs as logsIniciais } from '../mocks';
import { carregarLogs, salvar } from '../lib/logsArmazenados';

export interface EstadoLogs {
  logs: LogAtividade[];
}

export type AcaoLogs = { tipo: 'adicionar'; log: LogAtividade };

/**
 * Reducer puro: sem `localStorage`, sem relógio — o registro já chega
 * pronto (`lib/log.ts` monta o objeto, a página decide quando chamar).
 */
export function reducerLogs(estado: EstadoLogs, acao: AcaoLogs): EstadoLogs {
  switch (acao.tipo) {
    case 'adicionar':
      return { logs: [...estado.logs, acao.log] };
  }
}

export function criarEstadoInicial(): EstadoLogs {
  return { logs: carregarLogs(logsIniciais) };
}

export interface ValorDosLogs {
  logs: LogAtividade[];
  adicionarLog: (log: LogAtividade) => void;
}

export const LogsContext = createContext<ValorDosLogs | null>(null);

interface Props {
  children: ReactNode;
}

function LogsProvider({ children }: Props) {
  const [estado, despachar] = useReducer(reducerLogs, undefined, criarEstadoInicial);

  /* Roda também na montagem, o que grava a semente dos mocks. A partir daí
     o armazenamento é a fonte, e um log novo não é engolido pela semente na
     próxima recarga. */
  useEffect(() => {
    salvar(estado.logs);
  }, [estado.logs]);

  const valor = useMemo<ValorDosLogs>(
    () => ({
      logs: estado.logs,
      adicionarLog: (log) => despachar({ tipo: 'adicionar', log }),
    }),
    [estado.logs],
  );

  return <LogsContext.Provider value={valor}>{children}</LogsContext.Provider>;
}

export default LogsProvider;
