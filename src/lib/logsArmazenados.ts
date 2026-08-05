import type { AcaoLog, LogAtividade } from '../types';

/**
 * Persistência dos logs. Mesmas premissas do resto do projeto: o conteúdo
 * lido não é confiável e o armazenamento pode lançar.
 */

export const CHAVE_LOGS = 'compia:logs:v1';

const ACOES_VALIDAS: readonly AcaoLog[] = [
  'login',
  'logout',
  'produto_criado',
  'produto_editado',
  'produto_excluido',
  'pedido_status_alterado',
  'email_enviado',
];

const ehTextoNaoVazio = (valor: unknown): valor is string =>
  typeof valor === 'string' && valor !== '';

/**
 * Validação de superfície: confere os campos que a tela de logs indexa e
 * filtra (autor, ação, entidade, data). `entidadeId` é opcional no tipo, e
 * segue opcional aqui — sua ausência não invalida o registro.
 */
function ehLogValido(valor: unknown): valor is LogAtividade {
  if (typeof valor !== 'object' || valor === null) return false;

  const l = valor as Record<string, unknown>;

  return (
    ehTextoNaoVazio(l.id) &&
    ehTextoNaoVazio(l.usuarioId) &&
    typeof l.acao === 'string' &&
    (ACOES_VALIDAS as readonly string[]).includes(l.acao) &&
    ehTextoNaoVazio(l.entidade) &&
    (l.entidadeId === undefined || typeof l.entidadeId === 'string') &&
    typeof l.descricao === 'string' &&
    ehTextoNaoVazio(l.em)
  );
}

export function serializar(logs: LogAtividade[]): string {
  return JSON.stringify(logs);
}

/**
 * Testes de mesa:
 *   desserializar(serializar(logs))    → os 3 logs dos mocks
 *   desserializar('{{{')               → []      (não lança)
 *   desserializar('')                  → []
 *   desserializar('{}')                → []      (não é array)
 *   log sem usuarioId                  → descartado
 *   log com acao inventada             → descartado
 *   array misto                        → só os válidos sobrevivem
 */
export function desserializar(bruto: string): LogAtividade[] {
  let analisado: unknown;

  try {
    analisado = JSON.parse(bruto);
  } catch {
    return [];
  }

  if (!Array.isArray(analisado)) return [];

  return analisado.filter(ehLogValido);
}

export function carregar(): LogAtividade[] | null {
  try {
    if (typeof localStorage === 'undefined') return null;

    const bruto = localStorage.getItem(CHAVE_LOGS);
    if (bruto === null) return null;

    return desserializar(bruto);
  } catch {
    return null;
  }
}

export function salvar(logs: LogAtividade[]): void {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(CHAVE_LOGS, serializar(logs));
  } catch {
    /* Sem espaço ou sem permissão: a sessão segue, só não persiste. */
  }
}

/**
 * Carga inicial. Sem nada gravado, semeia com os mocks — o painel não pode
 * abrir vazio numa demonstração.
 *
 * Testes de mesa:
 *   sem nada gravado      → os 3 logs dos mocks
 *   gravado com 1 log     → só esse 1
 *   gravado vazio ('[]')  → []
 *   gravado corrompido    → []    (não lança; a chave é reescrita na sequência)
 */
export function carregarLogs(semente: LogAtividade[]): LogAtividade[] {
  const guardados = carregar();

  return guardados === null ? semente : guardados;
}
