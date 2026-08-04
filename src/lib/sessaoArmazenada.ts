import type { Cliente, Usuario } from '../types';
import { CLIENTE_PADRAO_ID, buscarCliente } from './sessao';

/**
 * Persistência da sessão. Mesmas premissas do carrinho: o conteúdo lido de
 * `localStorage` não é confiável, e nem o armazenamento em si — no modo
 * privado do Safari ele existe e lança ao escrever.
 *
 * Só ids são guardados. Gravar o objeto inteiro deixaria uma cópia velha de
 * cliente e usuário competindo com os mocks; o id sempre resolve para o dado
 * de agora.
 */

export const CHAVE_SESSAO = 'compia:sessao:v1';

export interface SessaoSalva {
  clienteId: string;
  /** `null` quando ninguém da equipe está logado. */
  usuarioId: string | null;
}

/* ------------------------------------------------------------------ */
/* 1. Serialização                                                     */
/* ------------------------------------------------------------------ */

export function serializar(sessao: SessaoSalva): string {
  return JSON.stringify(sessao);
}

/**
 * Devolve `null` para qualquer coisa que não tenha exatamente a forma
 * esperada — inclusive JSON corrompido, que não pode lançar.
 *
 * Testes de mesa:
 *   desserializar('{"clienteId":"cli-002","usuarioId":null}')      → objeto
 *   desserializar('{"clienteId":"cli-002","usuarioId":"usr-001"}') → objeto
 *   desserializar('{{{')                                           → null
 *   desserializar('')                                              → null
 *   desserializar('null')                                          → null
 *   desserializar('[]')                                            → null
 *   desserializar('{"clienteId":""}')                              → null
 *   desserializar('{"clienteId":"cli-002"}')                       → null  (falta usuarioId)
 *   desserializar('{"clienteId":1,"usuarioId":null}')              → null
 *   desserializar('{"clienteId":"c","usuarioId":7}')               → null
 */
export function desserializar(bruto: string): SessaoSalva | null {
  let analisado: unknown;

  try {
    analisado = JSON.parse(bruto);
  } catch {
    return null;
  }

  if (typeof analisado !== 'object' || analisado === null || Array.isArray(analisado)) {
    return null;
  }

  const candidato = analisado as Record<string, unknown>;

  if (typeof candidato.clienteId !== 'string' || candidato.clienteId === '') return null;

  const usuarioId = candidato.usuarioId;
  const usuarioValido =
    usuarioId === null || (typeof usuarioId === 'string' && usuarioId !== '');
  if (!usuarioValido) return null;

  return {
    clienteId: candidato.clienteId,
    usuarioId: typeof usuarioId === 'string' ? usuarioId : null,
  };
}

/* ------------------------------------------------------------------ */
/* 2. Acesso ao armazenamento                                          */
/* ------------------------------------------------------------------ */

export function carregar(): SessaoSalva | null {
  try {
    if (typeof localStorage === 'undefined') return null;

    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (bruto === null) return null;

    return desserializar(bruto);
  } catch {
    return null;
  }
}

export function salvar(sessao: SessaoSalva): void {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(CHAVE_SESSAO, serializar(sessao));
  } catch {
    /* Sem espaço ou sem permissão: a sessão segue viva em memória. */
  }
}

/* ------------------------------------------------------------------ */
/* 3. Resolução contra os mocks                                        */
/* ------------------------------------------------------------------ */

export interface SessaoResolvida {
  cliente: Cliente;
  usuario: Usuario | null;
}

/**
 * Transforma ids salvos em objetos de agora.
 *
 * Estágios:
 *   1. Cliente desconhecido cai no padrão. Um id que não existe mais não
 *      pode deixar a loja sem cliente corrente — `Pedido.clienteId` é
 *      obrigatório.
 *   2. Usuário desconhecido vira `null`.
 *   3. Usuário **inativo** também vira `null`: desativar uma conta precisa
 *      valer para quem já estava logado, senão a sessão salva vira um
 *      contorno da regra.
 *
 * Assume `clientes` não vazio — é dado de mock, não entrada de usuário.
 *
 * Testes de mesa:
 *   sessão nula                            → cli-001, usuário null
 *   { cli-002, null }                      → cli-002, usuário null
 *   { cli-999, null }                      → cli-001 (padrão)
 *   { cli-001, usr-001 }                   → usuário Renata
 *   { cli-001, usr-999 }                   → usuário null
 *   { cli-001, usr-004 } (inativo)         → usuário null
 */
export function resolverSessao(
  salva: SessaoSalva | null,
  clientes: Cliente[],
  usuarios: Usuario[],
): SessaoResolvida {
  // 1. Cliente.
  const padrao = buscarCliente(clientes, CLIENTE_PADRAO_ID) ?? clientes[0];
  const cliente =
    salva === null ? padrao : (buscarCliente(clientes, salva.clienteId) ?? padrao);

  // 2 e 3. Usuário da equipe.
  let usuario: Usuario | null = null;
  if (salva !== null && salva.usuarioId !== null) {
    const encontrado = usuarios.find((candidato) => candidato.id === salva.usuarioId);
    usuario = encontrado !== undefined && encontrado.ativo ? encontrado : null;
  }

  return { cliente, usuario };
}

/** Carga inicial: lê, valida e resolve numa passada. */
export function carregarSessao(clientes: Cliente[], usuarios: Usuario[]): SessaoResolvida {
  return resolverSessao(carregar(), clientes, usuarios);
}
