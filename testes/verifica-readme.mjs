import { readFileSync } from 'node:fs';
import { doProjeto, carregarModulo, criarPlacar } from './arnes.mjs';

/**
 * O README promete dados de teste de pagamento que funcionam de verdade no
 * app. Este teste lê o próprio README.md — não copia a string aqui — para
 * que editar o exemplo sem verificar quebre a suíte em vez de envelhecer em
 * silêncio.
 */

const { caso, secao, encerrar } = criarPlacar();

const pg = await carregarModulo('src/lib/pagamento.ts', 'pagamentoParaReadme');
const readme = readFileSync(doProjeto('README.md'), 'utf8');

const NOME_PARA_BANDEIRA = {
  Visa: 'visa',
  MasterCard: 'mastercard',
  Elo: 'elo',
  Amex: 'amex',
  'American Express': 'amex',
};

/* ============ 1. extrai o número de exemplo e a bandeira afirmada ============ */
secao('extração do exemplo aprovado a partir do README');

const casamentoExemplo = readme.match(/por exemplo,\s*`(\d[\d ]{8,23}\d)`\s*\(bandeira\s+([^)]+)\)/);
caso('README ainda tem o exemplo no formato esperado (número + bandeira entre parênteses)', casamentoExemplo !== null);

const numeroExemplo = casamentoExemplo?.[1] ?? '';
const nomeDaBandeiraAfirmada = casamentoExemplo?.[2] ?? '';
const bandeiraEsperada = NOME_PARA_BANDEIRA[nomeDaBandeiraAfirmada];

caso(`bandeira "${nomeDaBandeiraAfirmada}" citada no README é conhecida deste teste`, bandeiraEsperada !== undefined);

/* ============ 2. o exemplo aprovado se comporta como o README promete ============ */
secao(`número extraído do README: "${numeroExemplo}"`);

caso('passa no algoritmo de Luhn', pg.luhn(numeroExemplo));
caso(`detectarBandeira devolve "${bandeiraEsperada}", como o README afirma`, pg.detectarBandeira(numeroExemplo) === bandeiraEsperada);

const dadosDoExemplo = { numero: numeroExemplo, nome: 'TESTE README', validade: '12/30', cvv: '123', parcelas: 1 };
const pagamentoDoExemplo = pg.processarCartao(dadosDoExemplo, 10000);
caso('processarCartao aprova o cartão de exemplo', pagamentoDoExemplo.status === 'aprovado');

/* ============ 3. o cartão de recusa citado no README é mesmo recusado ============ */
secao('cartão de recusa citado no README');

const casamentosRecusado = [
  ...readme.matchAll(/`(\d[\d ]{8,23}\d)`,?\s*(?:que\s+)?é sempre recusado/g),
];
caso('README cita ao menos uma vez o cartão de recusa no formato esperado', casamentosRecusado.length > 0);

const numerosRecusadosCitados = casamentosRecusado.map((m) => m[1]);
caso(
  'todas as menções do cartão de recusa no README concordam entre si',
  numerosRecusadosCitados.every((numero) => numero === numerosRecusadosCitados[0]),
);

const numeroRecusado = numerosRecusadosCitados[0] ?? '';
const dadosDoRecusado = { numero: numeroRecusado, nome: 'TESTE README', validade: '12/30', cvv: '123', parcelas: 1 };
const pagamentoDoRecusado = pg.processarCartao(dadosDoRecusado, 10000);
caso(`"${numeroRecusado}" é mesmo recusado por processarCartao`, pagamentoDoRecusado.status === 'recusado');

encerrar();
