import type { Endereco, MetodoPagamento, ModalidadeEntrega } from '../types';
import { mensagemDeResumoDeErros } from './formatadores';
import { validarCep } from './frete';
import {
  detectarBandeira,
  luhn,
  validarCvv,
  validarValidade,
  type DadosDoCartao,
} from './pagamento';

/**
 * Regras do fluxo de checkout. Puro: decide quais passos existem, se um
 * passo está liberado e o que está errado em cada campo — sem React, sem
 * relógio próprio.
 *
 * As mensagens de erro nascem aqui, prontas, e explicam como resolver.
 */

export type Passo = 1 | 2 | 3 | 4;

export const TITULO_DO_PASSO: Record<Passo, string> = {
  1: 'Endereço e entrega',
  2: 'Frete',
  3: 'Pagamento',
  4: 'Confirmação',
};

export interface EstadoDoCheckout {
  endereco: Endereco;
  modalidade: ModalidadeEntrega;
  opcaoFreteId: string | null;
  metodo: MetodoPagamento | null;
  cartao: DadosDoCartao;
}

/* ------------------------------------------------------------------ */
/* 1. Quais passos existem                                             */
/* ------------------------------------------------------------------ */

/**
 * Pedido sem peso não tem endereço nem frete: pula direto para o pagamento.
 * Retirada tem endereço (o da editora) mas não tem escolha de frete.
 *
 * Testes de mesa:
 *   passosVisiveis(true, 'envio')     → [1,2,3,4]
 *   passosVisiveis(true, 'retirada')  → [1,3,4]
 *   passosVisiveis(false, 'download') → [3,4]
 *   passosVisiveis(false, 'envio')    → [3,4]   (sem peso, modalidade não importa)
 */
export function passosVisiveis(
  precisaDeEntrega: boolean,
  modalidade: ModalidadeEntrega,
): Passo[] {
  if (!precisaDeEntrega) return [3, 4];
  if (modalidade === 'retirada') return [1, 3, 4];

  return [1, 2, 3, 4];
}

/* ------------------------------------------------------------------ */
/* 2. Validação do endereço                                            */
/* ------------------------------------------------------------------ */

export type ErrosDoEndereco = Partial<Record<keyof Endereco, string>>;

/**
 * Testes de mesa:
 *   endereço do cli-001 → {} (nenhum erro)
 *   CEP '584'           → erro em cep
 *   logradouro vazio    → erro em logradouro
 *   uf 'PBB'            → erro em uf
 *   tudo vazio          → 6 erros
 */
export function errosDoEndereco(endereco: Endereco): ErrosDoEndereco {
  const erros: ErrosDoEndereco = {};

  if (!validarCep(endereco.cep)) {
    erros.cep = 'CEP inválido. São 8 dígitos, como 58429-140.';
  }
  if (endereco.logradouro.trim() === '') {
    erros.logradouro = 'Informe a rua ou avenida.';
  }
  if (endereco.numero.trim() === '') {
    erros.numero = 'Informe o número. Use “s/n” se não houver.';
  }
  if (endereco.bairro.trim() === '') {
    erros.bairro = 'Informe o bairro.';
  }
  if (endereco.cidade.trim() === '') {
    erros.cidade = 'Informe a cidade.';
  }
  if (!/^[A-Za-zÀ-ÿ]{2}$/.test(endereco.uf.trim())) {
    erros.uf = 'UF são duas letras, como PB.';
  }

  return erros;
}

/* ------------------------------------------------------------------ */
/* 3. Validação do cartão                                              */
/* ------------------------------------------------------------------ */

export type CampoDoCartao = 'numero' | 'nome' | 'validade' | 'cvv';
export type ErrosDoCartao = Partial<Record<CampoDoCartao, string>>;

/**
 * `agora` por parâmetro, como em `validarValidade`.
 *
 * Testes de mesa (agora = '2026-08-04T12:00:00Z'):
 *   cartão válido            → {}
 *   número que falha no Luhn → erro em numero
 *   cartão de teste recusado → {} (é válido; a recusa é do processamento)
 *   nome vazio               → erro em nome
 *   validade '07/26'         → erro em validade
 *   cvv '12' em visa         → erro em cvv
 *   cvv '123' em amex        → erro em cvv
 */
export function errosDoCartao(dados: DadosDoCartao, agora: string): ErrosDoCartao {
  const erros: ErrosDoCartao = {};

  if (!luhn(dados.numero)) {
    erros.numero = 'Número de cartão inválido. Confira os dígitos.';
  }
  if (dados.nome.trim() === '') {
    erros.nome = 'Digite o nome como está impresso no cartão.';
  }
  if (!validarValidade(dados.validade, agora)) {
    erros.validade = 'Validade vencida ou fora do formato. Use MM/AA.';
  }
  if (!validarCvv(dados.cvv, detectarBandeira(dados.numero))) {
    erros.cvv =
      detectarBandeira(dados.numero) === 'amex'
        ? 'CVV da Amex tem 4 dígitos.'
        : 'CVV tem 3 dígitos, no verso do cartão.';
  }

  return erros;
}

function semErros(erros: object): boolean {
  return Object.keys(erros).length === 0;
}

/* ------------------------------------------------------------------ */
/* 4. Liberação de passo                                               */
/* ------------------------------------------------------------------ */

/** Retirada não precisa de endereço do cliente: o endereço é o da editora. */
export function passo1Concluido(estado: EstadoDoCheckout): boolean {
  if (estado.modalidade === 'retirada') return true;

  return semErros(errosDoEndereco(estado.endereco));
}

export function passo2Concluido(estado: EstadoDoCheckout): boolean {
  return estado.opcaoFreteId !== null;
}

export function passo3Concluido(estado: EstadoDoCheckout, agora: string): boolean {
  if (estado.metodo === 'pix') return true;
  if (estado.metodo === 'cartao') return semErros(errosDoCartao(estado.cartao, agora));

  return false;
}

/**
 * Primeiro passo que ainda falta preencher. É para onde a URL é redirecionada
 * quando alguém tenta pular etapas com `?passo=`.
 *
 * Testes de mesa:
 *   nada preenchido, com entrega   → 1
 *   endereço ok, sem frete         → 2
 *   endereço e frete ok, sem meio  → 3
 *   tudo ok                        → 4
 *   só e-book, nada preenchido     → 3   (endereço e frete nem existem)
 *   retirada, sem meio             → 3   (frete não existe)
 */
export function primeiroPassoPendente(
  estado: EstadoDoCheckout,
  precisaDeEntrega: boolean,
  agora: string,
): Passo {
  const visiveis = passosVisiveis(precisaDeEntrega, estado.modalidade);

  if (visiveis.includes(1) && !passo1Concluido(estado)) return 1;
  if (visiveis.includes(2) && !passo2Concluido(estado)) return 2;
  if (!passo3Concluido(estado, agora)) return 3;

  return 4;
}

/**
 * Passo pedido na URL, limitado ao que já pode ser acessado.
 *
 * Testes de mesa:
 *   pedido 3 com endereço pendente → 1
 *   pedido 4 com tudo pronto       → 4
 *   pedido 2 num pedido só de e-book → 3  (o passo nem existe)
 *   pedido 9 ou 0 ou 'abc'         → o primeiro pendente
 */
export function passoPermitido(
  pedido: number,
  estado: EstadoDoCheckout,
  precisaDeEntrega: boolean,
  agora: string,
): Passo {
  const pendente = primeiroPassoPendente(estado, precisaDeEntrega, agora);
  const visiveis = passosVisiveis(precisaDeEntrega, estado.modalidade);

  if (!Number.isInteger(pedido)) return pendente;
  if (!visiveis.includes(pedido as Passo)) return pendente;
  if (pedido > pendente) return pendente;

  return pedido as Passo;
}

/* ------------------------------------------------------------------ */
/* 5. Máscaras                                                         */
/* ------------------------------------------------------------------ */

/**
 * Agrupa o número do cartão. Reformata o que vier inteiro, então colar um
 * número completo funciona — a máscara não pode atrapalhar quem cola.
 *
 * Amex tem agrupamento próprio, 4-6-5.
 *
 * Testes de mesa:
 *   '4539578763621486'      → '4539 5787 6362 1486'
 *   '4539 5787 6362 1486'   → '4539 5787 6362 1486'  (idempotente)
 *   '4539-5787-6362-1486'   → '4539 5787 6362 1486'  (aceita colado com hífen)
 *   '378282246310005'       → '3782 822463 10005'    (Amex)
 *   '4539'                  → '4539'
 *   ''                      → ''
 *   '45395787636214861234'  → corta em 19 dígitos
 */
export function formatarNumeroDeCartao(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 19);
  if (digitos === '') return '';

  if (detectarBandeira(digitos) === 'amex') {
    return [digitos.slice(0, 4), digitos.slice(4, 10), digitos.slice(10, 15)]
      .filter((parte) => parte !== '')
      .join(' ');
  }

  return digitos.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Testes de mesa:
 *   '0926'   → '09/26'
 *   '09/26'  → '09/26'  (idempotente)
 *   '9'      → '9'
 *   '09'     → '09'
 *   '092'    → '09/2'
 *   '09262'  → '09/26'  (corta)
 *   ''       → ''
 */
export function formatarValidade(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  if (digitos.length <= 2) return digitos;

  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

/** CVV: só dígitos, no máximo 4 (Amex). */
export function formatarCvv(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 4);
}

/* ------------------------------------------------------------------ */
/* 6. Textos                                                           */
/* ------------------------------------------------------------------ */

/**
 * Aviso mostrado no carrinho quando o checkout é abortado por troca de
 * cliente. O seletor de cliente é de demonstração e vai ser usado no meio
 * de uma apresentação: abortar com explicação é melhor que emitir um pedido
 * com o `clienteId` de um e os itens de outro.
 *
 * Testes de mesa:
 *   mensagemDeCheckoutAbortado('Larissa Fontes')
 *     → 'O checkout foi reiniciado porque a sessão mudou para Larissa Fontes. Este é o carrinho dela.'
 */
export function mensagemDeCheckoutAbortado(nomeDoCliente: string): string {
  return `O checkout foi reiniciado porque a sessão mudou para ${nomeDoCliente}. Este é o carrinho dela.`;
}

/** Recusa do cartão. Diz o que fazer, não só que deu errado. */
export const ERRO_DE_CARTAO_RECUSADO =
  'Cartão recusado pela operadora. Confira os dados, tente outro cartão ou pague com PIX. Nada foi cobrado e seu carrinho continua intacto.';

export const ERRO_FRETE_NAO_ESCOLHIDO = 'Escolha uma opção de frete para continuar.';
export const ERRO_PAGAMENTO_NAO_ESCOLHIDO = 'Escolha uma forma de pagamento para continuar.';

/**
 * Texto da região viva única do checkout quando `avancar` bloqueia a
 * transição de passo. Frete e meio de pagamento não têm campo — não há o
 * que contar — por isso caem num aviso fixo em vez de um resumo numérico.
 *
 * Testes de mesa:
 *   pendente 1, 3 erros de endereço      → '3 campos precisam de correção'
 *   pendente 2                            → ERRO_FRETE_NAO_ESCOLHIDO
 *   pendente 3, metodo nulo               → ERRO_PAGAMENTO_NAO_ESCOLHIDO
 *   pendente 3, metodo cartão, 2 erros    → '2 campos precisam de correção'
 */
export function mensagemDePassoBloqueado(
  pendente: Passo,
  metodo: MetodoPagamento | null,
  quantidadeDeErrosDeEndereco: number,
  quantidadeDeErrosDeCartao: number,
): string {
  if (pendente === 1) return mensagemDeResumoDeErros(quantidadeDeErrosDeEndereco);
  if (pendente === 2) return ERRO_FRETE_NAO_ESCOLHIDO;
  if (metodo === 'cartao') return mensagemDeResumoDeErros(quantidadeDeErrosDeCartao);

  return ERRO_PAGAMENTO_NAO_ESCOLHIDO;
}
