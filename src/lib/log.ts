import type { AcaoLog, LogAtividade } from '../types';

/**
 * Mecânica dos logs. Puro: monta o registro e filtra a lista — quem escreve
 * de fato (despachar para o `LogsContext`) é a página, nunca aqui.
 */

export const ROTULO_DE_ACAO: Record<AcaoLog, string> = {
  login: 'Login',
  logout: 'Logout',
  produto_criado: 'Produto criado',
  produto_editado: 'Produto editado',
  produto_excluido: 'Produto excluído',
  pedido_status_alterado: 'Status do pedido alterado',
  email_enviado: 'E-mail enviado',
};

/* ------------------------------------------------------------------ */
/* 1. Identificação e montagem                                         */
/* ------------------------------------------------------------------ */

/**
 * Sequencial a partir do maior `log-NNN` já usado — mesma família de
 * `gerarNumeroPedido` e `gerarIdDeProduto`.
 *
 * Testes de mesa:
 *   gerarIdDeLog(logs)                          → 'log-004' (mocks vão até log-003)
 *   gerarIdDeLog([])                            → 'log-001'
 *   gerarIdDeLog([{id:'log-005'},{id:'log-002'}]) → 'log-006'
 *   id malformado ('log-abc') é ignorado
 */
export function gerarIdDeLog(logs: { id: string }[]): string {
  const maior = logs.reduce((maximo, log) => {
    const combinacao = /^log-(\d+)$/.exec(log.id);
    if (combinacao === null) return maximo;

    return Math.max(maximo, Number(combinacao[1]));
  }, 0);

  return `log-${String(maior + 1).padStart(3, '0')}`;
}

export interface DadosDoLog {
  usuarioId: string;
  acao: AcaoLog;
  /** Ex.: 'produto', 'pedido', 'usuario'. */
  entidade: string;
  entidadeId?: string;
  descricao: string;
}

/**
 * Monta o registro pronto para `adicionarLog` — a página faz a chamada de
 * escrita, esta função só decide o formato. `agora` por parâmetro, como em
 * todo o projeto: nenhuma função pura lê o relógio.
 *
 * Testes de mesa:
 *   criarLog([], {usuarioId:'usr-001', acao:'login', entidade:'usuario', entidadeId:'usr-001', descricao:'Entrou'}, AGORA)
 *     → { id: 'log-001', usuarioId: 'usr-001', acao: 'login', entidade: 'usuario', entidadeId: 'usr-001', descricao: 'Entrou', em: AGORA }
 *   sem entidadeId → chave ausente no objeto, não string vazia
 */
export function criarLog(
  logsExistentes: LogAtividade[],
  dados: DadosDoLog,
  agora: string,
): LogAtividade {
  return {
    id: gerarIdDeLog(logsExistentes),
    usuarioId: dados.usuarioId,
    acao: dados.acao,
    entidade: dados.entidade,
    ...(dados.entidadeId === undefined ? {} : { entidadeId: dados.entidadeId }),
    descricao: dados.descricao,
    em: agora,
  };
}

/* ------------------------------------------------------------------ */
/* 2. Filtro da lista do painel                                        */
/* ------------------------------------------------------------------ */

export interface FiltrosDeLogs {
  acao: AcaoLog | '';
  usuarioId: string;
}

/**
 * Mais recente primeiro. Filtro por ação exata e por usuário exato —
 * `/admin/logs` não tem busca livre, só os dois seletores da spec.
 *
 * Testes de mesa (sobre os 3 logs do mock):
 *   sem filtro              → os 3, mais recente primeiro
 *   acao 'login'            → só o log de login
 *   usuarioId 'usr-002'     → só os logs desse usuário
 *   acao + usuarioId juntos → interseção dos dois
 */
export function filtrarLogs(logs: LogAtividade[], filtros: FiltrosDeLogs): LogAtividade[] {
  return logs
    .filter((log) => {
      if (filtros.acao !== '' && log.acao !== filtros.acao) return false;
      if (filtros.usuarioId !== '' && log.usuarioId !== filtros.usuarioId) return false;

      return true;
    })
    .sort((a, b) => b.em.localeCompare(a.em));
}
