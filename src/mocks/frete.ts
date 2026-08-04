import type { FaixaFrete } from '../types';

/**
 * Substitui a integração com os Correios.
 * O prefixo é comparado com os 2 primeiros dígitos do CEP; a faixa mais
 * específica encontrada vence. `padrao` é o fallback.
 */
export const tabelaFrete: FaixaFrete[] = [
  { prefixo: '58', regiao: 'Paraíba', custoPorKg: 900, taxaFixa: 1200, prazoDiasUteis: 2 },
  { prefixo: '50', regiao: 'Pernambuco', custoPorKg: 1100, taxaFixa: 1400, prazoDiasUteis: 3 },
  { prefixo: '59', regiao: 'Rio Grande do Norte', custoPorKg: 1100, taxaFixa: 1400, prazoDiasUteis: 3 },
  { prefixo: '40', regiao: 'Bahia', custoPorKg: 1300, taxaFixa: 1600, prazoDiasUteis: 5 },
  { prefixo: '60', regiao: 'Ceará', custoPorKg: 1300, taxaFixa: 1600, prazoDiasUteis: 5 },
  { prefixo: '01', regiao: 'São Paulo', custoPorKg: 1500, taxaFixa: 1900, prazoDiasUteis: 6 },
  { prefixo: '20', regiao: 'Rio de Janeiro', custoPorKg: 1500, taxaFixa: 1900, prazoDiasUteis: 6 },
  { prefixo: '30', regiao: 'Minas Gerais', custoPorKg: 1500, taxaFixa: 1900, prazoDiasUteis: 7 },
  { prefixo: '80', regiao: 'Paraná', custoPorKg: 1700, taxaFixa: 2100, prazoDiasUteis: 8 },
  { prefixo: '90', regiao: 'Rio Grande do Sul', custoPorKg: 1900, taxaFixa: 2300, prazoDiasUteis: 9 },
  { prefixo: '69', regiao: 'Amazonas', custoPorKg: 2600, taxaFixa: 3200, prazoDiasUteis: 14 },
];

export const faixaPadrao: FaixaFrete = {
  prefixo: 'padrao',
  regiao: 'Demais localidades',
  custoPorKg: 1800,
  taxaFixa: 2200,
  prazoDiasUteis: 10,
};

/** Frete grátis acima deste subtotal, em centavos. */
export const limiteFreteGratis = 30000;

/** Modalidade expressa: multiplica o valor e divide o prazo. */
export const fatorExpresso = { valor: 1.8, prazoDivisor: 2 };

export const localDeRetirada = {
  nome: 'COMPIA Editora — Sede',
  logradouro: 'Rua Aprígio Veloso, 882',
  bairro: 'Universitário',
  cidade: 'Campina Grande',
  uf: 'PB',
  cep: '58429-900',
  horario: 'Segunda a sexta, 9h às 17h',
};

/** Chave PIX fictícia da loja. Nunca usar uma chave real. */
export const chavePixLoja = '5f8c9a12-3b7d-4e6f-9a0c-1d2e3f4a5b6c';
