import type { BandeiraCartao, Pagamento } from '../types';
import { chavePixLoja } from '../mocks';

/**
 * Substitui o gateway de pagamento. Tudo local, tudo puro.
 *
 * REGRA DE SEGURANÇA: número completo, CVV e validade **nunca** saem daqui
 * dentro de um objeto. `processarCartao` recebe os dados, decide, e devolve
 * um `Pagamento` com apenas os quatro últimos dígitos e a bandeira. Nada
 * mais é guardado, logado ou colocado em estado global.
 */

/** Cartão de teste que a especificação manda recusar. */
export const CARTAO_RECUSADO = '4000000000000002';

/** Parcela mínima, em centavos. */
export const PARCELA_MINIMA = 3000;

/** Teto de parcelas sem juros. */
export const MAXIMO_DE_PARCELAS = 6;

/** Minutos até a cobrança PIX expirar. */
export const MINUTOS_ATE_EXPIRAR = 30;

const somenteDigitos = (valor: string) => valor.replace(/\D/g, '');

/* ------------------------------------------------------------------ */
/* 1. Número do cartão                                                 */
/* ------------------------------------------------------------------ */

/**
 * Algoritmo de Luhn. Da direita para a esquerda, dobra um dígito sim outro
 * não; dobra que passa de 9 subtrai 9. Soma múltipla de 10 passa.
 *
 * Testes de mesa:
 *   luhn('4539578763621486')  → true
 *   luhn('5555555555554444')  → true   (MasterCard de teste)
 *   luhn('378282246310005')   → true   (Amex de teste)
 *   luhn('4000000000000002')  → true   (o recusado é válido; recusa é regra de negócio)
 *   luhn('4539578763621487')  → false  (último dígito trocado)
 *   luhn('1234567812345678')  → false
 *   luhn('4539 5787 6362 1486') → true (espaços ignorados)
 *   luhn('')                  → false
 *   luhn('4')                 → false  (curto demais)
 */
export function luhn(numero: string): boolean {
  const digitos = somenteDigitos(numero);
  if (digitos.length < 12) return false;

  let soma = 0;
  let dobra = false;

  for (let i = digitos.length - 1; i >= 0; i--) {
    let valor = Number(digitos[i]);

    if (dobra) {
      valor *= 2;
      if (valor > 9) valor -= 9;
    }

    soma += valor;
    dobra = !dobra;
  }

  return soma % 10 === 0;
}

/**
 * Prefixos Elo. Precisam ser conferidos **antes** de Visa e MasterCard:
 * boa parte deles começa com 4 ou 5 e seria capturada por elas.
 * É um recorte dos BINs reais, suficiente para a demonstração.
 */
const PREFIXOS_ELO = [
  '4011', '4312', '4389', '4514', '4573', '4576',
  '5041', '5066', '5067', '5090',
  '6277', '6362', '6363', '6500', '6504', '6505', '6516', '6550',
];

/**
 * Testes de mesa:
 *   detectarBandeira('4539578763621486') → 'visa'
 *   detectarBandeira('5555555555554444') → 'mastercard'
 *   detectarBandeira('2223000048400011') → 'mastercard'  (faixa 2221–2720)
 *   detectarBandeira('378282246310005')  → 'amex'
 *   detectarBandeira('4011780000000000') → 'elo'   (começa com 4, mas é Elo)
 *   detectarBandeira('5067230000000000') → 'elo'
 *   detectarBandeira('6011000000000000') → 'desconhecida'
 *   detectarBandeira('')                 → 'desconhecida'
 */
export function detectarBandeira(numero: string): BandeiraCartao {
  const digitos = somenteDigitos(numero);
  if (digitos.length < 4) return 'desconhecida';

  if (PREFIXOS_ELO.includes(digitos.slice(0, 4))) return 'elo';

  const doisPrimeiros = Number(digitos.slice(0, 2));
  if (doisPrimeiros === 34 || doisPrimeiros === 37) return 'amex';

  if (digitos.startsWith('4')) return 'visa';

  if (doisPrimeiros >= 51 && doisPrimeiros <= 55) return 'mastercard';

  const quatroPrimeiros = Number(digitos.slice(0, 4));
  if (quatroPrimeiros >= 2221 && quatroPrimeiros <= 2720) return 'mastercard';

  return 'desconhecida';
}

/* ------------------------------------------------------------------ */
/* 2. Validade e CVV                                                   */
/* ------------------------------------------------------------------ */

/**
 * Formato MM/AA, mês entre 1 e 12, não vencido.
 *
 * `agora` vem por parâmetro, nunca de `new Date()` dentro da função: sem
 * isso o teste dependeria do dia em que roda. Comparação em UTC — validade
 * de cartão não tem precisão de fuso.
 *
 * O cartão vale até o **último dia** do mês impresso, então o próprio mês
 * corrente ainda passa.
 *
 * Testes de mesa (agora = '2026-08-04T12:00:00Z'):
 *   validarValidade('08/26', agora) → true   (vence no fim deste mês)
 *   validarValidade('09/26', agora) → true
 *   validarValidade('12/30', agora) → true
 *   validarValidade('07/26', agora) → false  (mês passado)
 *   validarValidade('08/25', agora) → false  (ano passado)
 *   validarValidade('13/26', agora) → false  (mês inexistente)
 *   validarValidade('00/26', agora) → false
 *   validarValidade('8/26', agora)  → false  (formato)
 *   validarValidade('08-26', agora) → false
 *   validarValidade('', agora)      → false
 */
export function validarValidade(validade: string, agora: string): boolean {
  const partes = /^(\d{2})\/(\d{2})$/.exec(validade.trim());
  if (partes === null) return false;

  const mes = Number(partes[1]);
  const ano = 2000 + Number(partes[2]);
  if (mes < 1 || mes > 12) return false;

  const referencia = new Date(agora);
  if (Number.isNaN(referencia.getTime())) return false;

  const anoAtual = referencia.getUTCFullYear();
  const mesAtual = referencia.getUTCMonth() + 1;

  if (ano !== anoAtual) return ano > anoAtual;
  return mes >= mesAtual;
}

/**
 * Amex usa 4 dígitos; o resto, 3.
 *
 * Testes de mesa:
 *   validarCvv('123', 'visa')          → true
 *   validarCvv('1234', 'visa')         → false
 *   validarCvv('1234', 'amex')         → true
 *   validarCvv('123', 'amex')          → false
 *   validarCvv('12a', 'visa')          → false
 *   validarCvv('', 'visa')             → false
 *   validarCvv('123', 'desconhecida')  → true
 */
export function validarCvv(cvv: string, bandeira: BandeiraCartao): boolean {
  const esperado = bandeira === 'amex' ? 4 : 3;

  return new RegExp(`^\\d{${esperado}}$`).test(cvv.trim());
}

/* ------------------------------------------------------------------ */
/* 3. Parcelas                                                         */
/* ------------------------------------------------------------------ */

/**
 * Até 6x sem juros, respeitando parcela mínima de R$ 30,00. Total baixo
 * devolve só `[1]` — nunca uma lista vazia, porque à vista sempre cabe.
 *
 * Testes de mesa:
 *   parcelasDisponiveis(15900) → [1,2,3,4,5]     (15900/3000 = 5,3)
 *   parcelasDisponiveis(44900) → [1,2,3,4,5,6]   (teto de 6)
 *   parcelasDisponiveis(9000)  → [1,2,3]
 *   parcelasDisponiveis(6000)  → [1,2]
 *   parcelasDisponiveis(3000)  → [1]
 *   parcelasDisponiveis(2999)  → [1]
 *   parcelasDisponiveis(0)     → [1]
 */
export function parcelasDisponiveis(total: number): number[] {
  const cabem = Math.floor(total / PARCELA_MINIMA);
  const maximo = Math.max(1, Math.min(MAXIMO_DE_PARCELAS, cabem));

  return Array.from({ length: maximo }, (_, indice) => indice + 1);
}

/* ------------------------------------------------------------------ */
/* 4. Cartão                                                           */
/* ------------------------------------------------------------------ */

export interface DadosDoCartao {
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
  parcelas: number;
}

/**
 * Sempre aprova, exceto o cartão de teste. Nenhuma latência simulada: o
 * projeto não finge rede.
 *
 * O que volta guarda **só** os quatro últimos dígitos e a bandeira. Número,
 * CVV, validade e nome ficam no formulário e morrem lá.
 *
 * `pagoEm` não é preenchido aqui: quem sabe a hora é `aplicarPagamento`.
 *
 * Testes de mesa:
 *   cartão comum      → status 'aprovado', ultimosDigitos '1486'
 *   4000000000000002  → status 'recusado'
 *   4000 0000 0000 0002 com espaços → 'recusado' (normaliza antes)
 *   nenhum caso       → objeto sem numero, cvv, validade ou nome
 */
export function processarCartao(dados: DadosDoCartao, total: number): Pagamento {
  const digitos = somenteDigitos(dados.numero);
  const recusado = digitos === CARTAO_RECUSADO;

  return {
    metodo: 'cartao',
    status: recusado ? 'recusado' : 'aprovado',
    valor: total,
    parcelas: dados.parcelas,
    ultimosDigitos: digitos.slice(-4),
    bandeira: detectarBandeira(digitos),
  };
}

/* ------------------------------------------------------------------ */
/* 5. PIX                                                              */
/* ------------------------------------------------------------------ */

/**
 * Resumo hexadecimal de 4 caracteres. Ocupa o lugar do CRC16 de um payload
 * EMV real: o que importa aqui é ser determinístico, não ser correto.
 */
function resumoHex(texto: string): string {
  let acumulado = 0;

  for (let i = 0; i < texto.length; i++) {
    acumulado = (acumulado * 31 + texto.charCodeAt(i)) % 0xffff;
  }

  return acumulado.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Cobrança PIX fictícia. Determinística: mesmos `total` e `agora` produzem
 * o mesmo payload, o que torna o QR testável.
 *
 * A chave é a `chavePixLoja` dos mocks — fictícia, nunca uma chave real.
 *
 * Testes de mesa (agora = '2026-08-04T12:00:00Z', total = 32736):
 *   status    → 'pendente'
 *   parcelas  → 1
 *   chavePix  → chavePixLoja
 *   expiraEm  → '2026-08-04T12:30:00.000Z'
 *   payload   → começa com '00020126FAKE' e termina com 4 hex
 *   dois chamados iguais → payloads idênticos
 *   totais diferentes    → payloads diferentes
 */
/**
 * A cobrança PIX venceu?
 *
 * `agora` vem por parâmetro pela mesma razão de `validarValidade`: função
 * pura, teste determinístico. Só cobrança PIX ainda pendente pode expirar —
 * uma já paga ou de cartão não.
 *
 * Testes de mesa (expiraEm = '2026-02-26T12:00:00Z', como em ped-003):
 *   agora antes do vencimento      → false
 *   agora exatamente no vencimento → true   (o minuto do vencimento já venceu)
 *   agora depois                   → true
 *   pagamento sem expiraEm         → false
 *   PIX já aprovado                → false
 *   cartão                         → false
 */
export function cobrancaExpirada(pagamento: Pagamento, agora: string): boolean {
  if (pagamento.metodo !== 'pix' || pagamento.status !== 'pendente') return false;
  if (pagamento.expiraEm === undefined) return false;

  const vencimento = new Date(pagamento.expiraEm).getTime();
  const referencia = new Date(agora).getTime();
  if (Number.isNaN(vencimento) || Number.isNaN(referencia)) return false;

  return referencia >= vencimento;
}

export function gerarCobrancaPix(total: number, agora: string): Pagamento {
  const chaveCompacta = chavePixLoja.replace(/-/g, '').toUpperCase();
  const corpo = `00020126FAKE${chaveCompacta}5204000053039865802BR54${total}`;

  const expira = new Date(new Date(agora).getTime() + MINUTOS_ATE_EXPIRAR * 60 * 1000);

  return {
    metodo: 'pix',
    status: 'pendente',
    valor: total,
    parcelas: 1,
    chavePix: chavePixLoja,
    payloadPix: `${corpo}6304${resumoHex(corpo + agora)}`,
    expiraEm: expira.toISOString(),
  };
}
