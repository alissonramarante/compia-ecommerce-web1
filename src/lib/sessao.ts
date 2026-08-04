import type { Cliente, Usuario } from '../types';

/**
 * Regras da sessão. Não há autenticação de verdade neste projeto: o cliente
 * corrente é um seletor de demonstração e o acesso da equipe confere apenas
 * se o e-mail existe em `usuarios` e se a conta está ativa.
 *
 * Os textos de erro nascem aqui, prontos, não no JSX — mesma regra dos
 * avisos de reconciliação do carrinho.
 */

/**
 * Cliente padrão da demonstração. `cli-001` tem endereço na faixa de CEP 58
 * (prazo de 2 dias) e já tem pedidos nos mocks, então o checkout e a área do
 * cliente abrem com dado real.
 */
export const CLIENTE_PADRAO_ID = 'cli-001';

/** Domínio dos e-mails da equipe, usado na mensagem de erro. */
export const DOMINIO_DA_EQUIPE = '@compia.com.br';

export type ResultadoDeAcesso =
  | { ok: true; usuario: Usuario }
  | { ok: false; erro: string };

/* ------------------------------------------------------------------ */
/* 1. Consultas                                                        */
/* ------------------------------------------------------------------ */

/**
 * Testes de mesa:
 *   buscarCliente(clientes, 'cli-002')?.nome → 'Eduardo Sampaio'
 *   buscarCliente(clientes, 'cli-999')       → undefined
 */
export function buscarCliente(clientes: Cliente[], id: string): Cliente | undefined {
  return clientes.find((cliente) => cliente.id === id);
}

/**
 * Endereço marcado como principal; se nenhum estiver, o primeiro serve.
 *
 * Testes de mesa:
 *   enderecoPrincipal(cli-001)?.cidade → 'Campina Grande'
 *   cliente sem endereço               → undefined
 */
export function enderecoPrincipal(cliente: Cliente) {
  return cliente.enderecos.find((endereco) => endereco.principal) ?? cliente.enderecos[0];
}

/**
 * Cidade/UF do endereço principal, para identificar o cliente na tela de
 * troca. Sem endereço cadastrado devolve string vazia.
 *
 * Testes de mesa:
 *   cidadeDoCliente(cli-001) → 'Campina Grande, PB'
 *   cidadeDoCliente(cli-002) → 'São Paulo, SP'
 *   cliente sem endereço     → ''
 */
export function cidadeDoCliente(cliente: Cliente): string {
  const endereco = enderecoPrincipal(cliente);
  if (endereco === undefined) return '';

  return `${endereco.cidade}, ${endereco.uf}`;
}

/**
 * Primeiro nome, para o cabeçalho. Nome vazio devolve string vazia em vez
 * de quebrar.
 *
 * Testes de mesa:
 *   primeiroNome('Yasmim Oliveira')  → 'Yasmim'
 *   primeiroNome('Larissa Fontes')   → 'Larissa'
 *   primeiroNome('  Ana  Lúcia  ')   → 'Ana'
 *   primeiroNome('Madonna')          → 'Madonna'
 *   primeiroNome('')                 → ''
 */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? '';
}

/* ------------------------------------------------------------------ */
/* 2. Acesso da equipe                                                 */
/* ------------------------------------------------------------------ */

/**
 * Confere o e-mail contra `usuarios`. Sem senha: o projeto é frontend e a
 * especificação pede login por perfil, não autenticação.
 *
 * Conta inativa é recusada com mensagem própria. Dizer "e-mail não existe"
 * quando a conta existe mas está desligada mandaria a pessoa procurar erro
 * de digitação no lugar errado.
 *
 * Testes de mesa:
 *   autenticarEquipe(usuarios, 'renata@compia.com.br')  → ok, perfil 'admin'
 *   autenticarEquipe(usuarios, 'RENATA@COMPIA.COM.BR')  → ok (caixa ignorada)
 *   autenticarEquipe(usuarios, '  gustavo@compia.com.br  ') → ok (espaços aparados)
 *   autenticarEquipe(usuarios, 'otavio@compia.com.br')  → erro de conta inativa
 *   autenticarEquipe(usuarios, 'ninguem@compia.com.br') → erro de não encontrado
 *   autenticarEquipe(usuarios, '')                      → erro de campo vazio
 */
export function autenticarEquipe(usuarios: Usuario[], email: string): ResultadoDeAcesso {
  const procurado = email.trim().toLowerCase();

  if (procurado === '') {
    return { ok: false, erro: 'Digite o e-mail da equipe para entrar.' };
  }

  const usuario = usuarios.find((candidato) => candidato.email.toLowerCase() === procurado);

  if (usuario === undefined) {
    return {
      ok: false,
      erro: `Não encontramos esse e-mail na equipe. Os endereços terminam em ${DOMINIO_DA_EQUIPE}.`,
    };
  }

  if (!usuario.ativo) {
    return {
      ok: false,
      erro: `A conta de ${usuario.nome} está inativa. Peça a um administrador para reativá-la.`,
    };
  }

  return { ok: true, usuario };
}
