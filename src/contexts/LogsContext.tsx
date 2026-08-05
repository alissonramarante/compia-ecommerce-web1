import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import type { LogAtividade } from '../types';
import { logs as logsIniciais } from '../mocks';
import { maiorNumeroDeLog, type DadosDoLog } from '../lib/log';
import { carregarLogs, salvar } from '../lib/logsArmazenados';

export interface EstadoLogs {
  logs: LogAtividade[];
  /**
   * Contador monotônico dos ids — nunca decresce. Mesmo padrão de
   * `sequenciaDeAvisos` no `CarrinhoContext`: reler `logs.length` (ou reler
   * a lista inteira, como fazia a antiga `gerarIdDeLog`) falha exatamente
   * quando dois logs são despachados no mesmo manipulador de evento — a
   * mudança de status e o e-mail de confirmação, por exemplo — porque o
   * segundo despacho ainda vê a lista de antes do primeiro.
   */
  proximoNumero: number;
}

export type AcaoLogs = { tipo: 'adicionar'; dados: DadosDoLog; em: string };

/**
 * Reducer puro: sem `localStorage`. O id nasce aqui, do contador em
 * estado — nunca de reler a lista, que o reducer não tem motivo para fazer
 * já que o contador é a fonte da verdade.
 */
export function reducerLogs(estado: EstadoLogs, acao: AcaoLogs): EstadoLogs {
  switch (acao.tipo) {
    case 'adicionar': {
      const log: LogAtividade = {
        id: `log-${String(estado.proximoNumero).padStart(3, '0')}`,
        usuarioId: acao.dados.usuarioId,
        acao: acao.dados.acao,
        entidade: acao.dados.entidade,
        ...(acao.dados.entidadeId === undefined ? {} : { entidadeId: acao.dados.entidadeId }),
        descricao: acao.dados.descricao,
        em: acao.em,
      };

      return { logs: [...estado.logs, log], proximoNumero: estado.proximoNumero + 1 };
    }
  }
}

export function criarEstadoInicial(): EstadoLogs {
  const logs = carregarLogs(logsIniciais);

  return { logs, proximoNumero: maiorNumeroDeLog(logs) + 1 };
}

export interface ValorDosLogs {
  logs: LogAtividade[];
  /** `em` por parâmetro, como em toda escrita do projeto: quem chama decide a hora. */
  registrarLog: (dados: DadosDoLog, em: string) => void;
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
      registrarLog: (dados, em) => despachar({ tipo: 'adicionar', dados, em }),
    }),
    [estado.logs],
  );

  return <LogsContext.Provider value={valor}>{children}</LogsContext.Provider>;
}

export default LogsProvider;
