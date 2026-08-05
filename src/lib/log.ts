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
 * Maior sufixo numérico entre os `log-NNN` existentes. Usada só uma vez, na
 * carga inicial do `LogsContext`, para o contador do reducer (`proximoNumero`)
 * continuar de onde a semente parou — depois disso quem numera é o reducer,
 * não esta função.
 *
 * Reler a lista a cada registro (como uma `gerarIdDeLog` faria) é exatamente
 * o bug que motivou o contador em estado: dois logs despachados no mesmo
 * manipulador de evento — mudança de status e o e-mail de confirmação, por
 * exemplo — veriam a mesma lista (o closure só atualiza no próximo render)
 * e sairiam com o mesmo id.
 *
 * Testes de mesa:
 *   maiorNumeroDeLog(logs)                            → 3 (mocks vão até log-003)
 *   maiorNumeroDeLog([])                              → 0
 *   maiorNumeroDeLog([{id:'log-005'},{id:'log-002'}]) → 5
 *   id malformado ('log-abc') é ignorado
 */
export function maiorNumeroDeLog(logs: { id: string }[]): number {
  return logs.reduce((maximo, log) => {
    const combinacao = /^log-(\d+)$/.exec(log.id);
    if (combinacao === null) return maximo;

    return Math.max(maximo, Number(combinacao[1]));
  }, 0);
}

export interface DadosDoLog {
  usuarioId: string;
  acao: AcaoLog;
  /** Ex.: 'produto', 'pedido', 'usuario'. */
  entidade: string;
  entidadeId?: string;
  descricao: string;
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
