import type { Pedido, StatusPedido } from '../types';

/**
 * Persistência dos pedidos. Mesmas premissas do carrinho e da sessão: o
 * conteúdo lido não é confiável e o armazenamento pode lançar.
 */

export const CHAVE_PEDIDOS = 'compia:pedidos:v1';

const STATUS_VALIDOS: readonly StatusPedido[] = [
  'aguardando_pagamento',
  'pago',
  'em_separacao',
  'enviado',
  'pronto_para_retirada',
  'entregue',
  'cancelado',
];

const ehTextoNaoVazio = (valor: unknown): valor is string =>
  typeof valor === 'string' && valor !== '';

/**
 * Validação de superfície, não de profundidade: confere os campos que o
 * aplicativo indexa e soma (id, número, cliente, status, totais, coleções).
 * O interior de `entrega` e `pagamento` não é auditado campo a campo — seria
 * reescrever o sistema de tipos em tempo de execução, e o risco real aqui é
 * lixo grosseiro, não um `Pagamento` sutilmente inválido.
 */
function ehPedidoValido(valor: unknown): valor is Pedido {
  if (typeof valor !== 'object' || valor === null) return false;

  const p = valor as Record<string, unknown>;

  return (
    ehTextoNaoVazio(p.id) &&
    ehTextoNaoVazio(p.numero) &&
    ehTextoNaoVazio(p.clienteId) &&
    Array.isArray(p.itens) &&
    Number.isFinite(p.subtotal) &&
    Number.isFinite(p.total) &&
    typeof p.entrega === 'object' &&
    p.entrega !== null &&
    typeof p.pagamento === 'object' &&
    p.pagamento !== null &&
    typeof p.status === 'string' &&
    (STATUS_VALIDOS as readonly string[]).includes(p.status) &&
    Array.isArray(p.historico) &&
    ehTextoNaoVazio(p.criadoEm) &&
    ehTextoNaoVazio(p.atualizadoEm)
  );
}

export function serializar(pedidos: Pedido[]): string {
  return JSON.stringify(pedidos);
}

/**
 * Testes de mesa:
 *   desserializar(serializar(pedidos))   → os 4 pedidos dos mocks
 *   desserializar('{{{')                 → []      (não lança)
 *   desserializar('')                    → []
 *   desserializar('{}')                  → []      (não é array)
 *   pedido sem numero                    → descartado
 *   pedido com status inventado          → descartado
 *   pedido com itens não-array           → descartado
 *   array misto                          → só os válidos sobrevivem
 */
export function desserializar(bruto: string): Pedido[] {
  let analisado: unknown;

  try {
    analisado = JSON.parse(bruto);
  } catch {
    return [];
  }

  if (!Array.isArray(analisado)) return [];

  return analisado.filter(ehPedidoValido);
}

export function carregar(): Pedido[] | null {
  try {
    if (typeof localStorage === 'undefined') return null;

    const bruto = localStorage.getItem(CHAVE_PEDIDOS);
    if (bruto === null) return null;

    return desserializar(bruto);
  } catch {
    return null;
  }
}

export function salvar(pedidos: Pedido[]): void {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(CHAVE_PEDIDOS, serializar(pedidos));
  } catch {
    /* Sem espaço ou sem permissão: a sessão segue, só não persiste. */
  }
}

/**
 * Carga inicial. Sem nada gravado, semeia com os mocks — o painel e a área
 * do cliente não podem abrir vazios numa demonstração.
 *
 * Depois da primeira gravação o armazenamento manda: pedido novo criado no
 * checkout não é sobrescrito pela semente a cada recarga.
 *
 * Testes de mesa:
 *   sem nada gravado        → os 4 pedidos dos mocks
 *   gravado com 1 pedido    → só esse 1
 *   gravado vazio ('[]')    → []    (o cliente apagou tudo, é intencional)
 *   gravado corrompido      → []    (não lança; a chave é reescrita na sequência)
 */
export function carregarPedidos(semente: Pedido[]): Pedido[] {
  const guardados = carregar();

  return guardados === null ? semente : guardados;
}
