import type { FaixaFrete, ItemCarrinho, OpcaoFrete, Produto } from '../types';
import { faixaPadrao, fatorExpresso, limiteFreteGratis, tabelaFrete } from '../mocks';
import { calcularSubtotal, pesoTotal } from './carrinho';

/**
 * Substitui a integração com os Correios. Puro: recebe CEP, itens e o
 * catálogo, devolve as opções. Sem rede, sem relógio.
 */

export const OPCAO_PADRAO = {
  id: 'frete-padrao',
  nome: 'Entrega padrão',
  transportadora: 'Correios — PAC',
} as const;

export const OPCAO_EXPRESSA = {
  id: 'frete-expresso',
  nome: 'Entrega expressa',
  transportadora: 'Correios — SEDEX',
} as const;

/* ------------------------------------------------------------------ */
/* 1. CEP                                                              */
/* ------------------------------------------------------------------ */

/**
 * Oito dígitos, com ou sem hífen. Não confere se o CEP existe de verdade —
 * não há base para consultar.
 *
 * Testes de mesa:
 *   validarCep('58429-140')  → true
 *   validarCep('58429140')   → true
 *   validarCep(' 58429140 ') → true
 *   validarCep('5842-9140')  → false  (hífen fora de lugar)
 *   validarCep('584291')     → false
 *   validarCep('584291401')  → false
 *   validarCep('58429-14a')  → false
 *   validarCep('')           → false
 */
export function validarCep(cep: string): boolean {
  return /^\d{5}-?\d{3}$/.test(cep.trim());
}

/**
 * Faixa de frete pelos dois primeiros dígitos. Sem correspondência cai em
 * `faixaPadrao` — CEP de região não tabelada continua comprável.
 *
 * Testes de mesa:
 *   faixaDoCep('58429-140').regiao → 'Paraíba'
 *   faixaDoCep('01310-200').regiao → 'São Paulo'
 *   faixaDoCep('40140130').regiao  → 'Bahia'
 *   faixaDoCep('99999-999').regiao → 'Demais localidades'
 *   faixaDoCep('').regiao          → 'Demais localidades'
 */
export function faixaDoCep(cep: string): FaixaFrete {
  const prefixo = cep.replace(/\D/g, '').slice(0, 2);

  return tabelaFrete.find((faixa) => faixa.prefixo === prefixo) ?? faixaPadrao;
}

/* ------------------------------------------------------------------ */
/* 2. Cálculo                                                          */
/* ------------------------------------------------------------------ */

/** Gramas → quilos arredondados para cima. Correios cobra por faixa. */
function emQuilos(gramas: number): number {
  return Math.ceil(gramas / 1000);
}

/**
 * Devolve as duas modalidades. Estágios:
 *   1. Sem peso não há despacho: pedido só com e-book devolve `[]`, e quem
 *      consome trata como entrega por download.
 *   2. Padrão = taxa fixa + custo por quilo.
 *   3. Expresso multiplica o valor e divide o prazo, com piso de 1 dia.
 *   4. Frete grátis zera **só a padrão**. O expresso é calculado sobre a
 *      base, nunca sobre o valor já zerado: frete grátis não pode virar
 *      expresso grátis.
 *
 * Não valida o CEP — quem chama valida antes, e um CEP fora da tabela cai
 * na faixa padrão de propósito.
 *
 * Testes de mesa (prod-001, 980 g → 1 kg; CEP 58 = PB, taxa 1200, kg 900, 2 dias):
 *   1 unidade  → padrão 2100 / 2 dias, expresso 3780 / 1 dia
 *   2 unidades → 1960 g = 2 kg → padrão 3000, expresso 5400
 *   subtotal ≥ 30000 → padrão 0, expresso segue pago
 *   só e-book  → []
 *   carrinho vazio → []
 */
export function calcularFrete(
  cep: string,
  itens: ItemCarrinho[],
  produtos: Produto[],
): OpcaoFrete[] {
  // 1. Nada a despachar.
  const gramas = pesoTotal(itens, produtos);
  if (gramas <= 0) return [];

  const faixa = faixaDoCep(cep);

  // 2. Base da modalidade padrão.
  const base = faixa.taxaFixa + faixa.custoPorKg * emQuilos(gramas);

  // 4. Gratuidade só na padrão.
  const temFreteGratis = calcularSubtotal(itens) >= limiteFreteGratis;

  return [
    {
      ...OPCAO_PADRAO,
      valor: temFreteGratis ? 0 : base,
      prazoDiasUteis: faixa.prazoDiasUteis,
    },
    {
      // 3. Sempre sobre a base, não sobre o valor já zerado.
      ...OPCAO_EXPRESSA,
      valor: Math.round(base * fatorExpresso.valor),
      prazoDiasUteis: Math.max(
        1,
        Math.ceil(faixa.prazoDiasUteis / fatorExpresso.prazoDivisor),
      ),
    },
  ];
}
