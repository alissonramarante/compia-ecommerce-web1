import { carregarModulo, criarPlacar } from './arnes.mjs';

const g = await carregarModulo('src/lib/pagamento.ts', 'pagamento');
const { chavePixLoja } = await carregarModulo('src/mocks/frete.ts', 'freteMock');

const { conferir, secao, encerrar } = criarPlacar();

/* ============ 1. Luhn ============ */
secao('luhn');
conferir('visa valido', g.luhn('4539578763621486'), true);
conferir('mastercard de teste', g.luhn('5555555555554444'), true);
conferir('amex de teste', g.luhn('378282246310005'), true);
conferir('o cartao recusado passa no Luhn', g.luhn('4000000000000002'), true);
conferir('digito final trocado', g.luhn('4539578763621487'), false);
conferir('sequencia obvia', g.luhn('1234567812345678'), false);
conferir('espacos sao ignorados', g.luhn('4539 5787 6362 1486'), true);
conferir('hifens sao ignorados', g.luhn('4539-5787-6362-1486'), true);
conferir('vazio', g.luhn(''), false);
conferir('curto demais', g.luhn('4'), false);
conferir('11 digitos e curto demais', g.luhn('45395787636'), false);
conferir('so letras', g.luhn('abcdefghijklmnop'), false);

/* ============ 2. bandeira ============ */
secao('detectarBandeira');
conferir('visa', g.detectarBandeira('4539578763621486'), 'visa');
conferir('mastercard 55', g.detectarBandeira('5555555555554444'), 'mastercard');
conferir('mastercard 51', g.detectarBandeira('5100000000000000'), 'mastercard');
conferir('mastercard faixa 2', g.detectarBandeira('2223000048400011'), 'mastercard');
conferir('mastercard limite inferior da faixa 2', g.detectarBandeira('2221000000000000'), 'mastercard');
conferir('mastercard limite superior da faixa 2', g.detectarBandeira('2720000000000000'), 'mastercard');
conferir('amex 37', g.detectarBandeira('378282246310005'), 'amex');
conferir('amex 34', g.detectarBandeira('348282246310005'), 'amex');
conferir('elo que comeca com 4 nao vira visa', g.detectarBandeira('4011780000000000'), 'elo');
conferir('elo que comeca com 5 nao vira mastercard', g.detectarBandeira('5067230000000000'), 'elo');
conferir('elo 6362', g.detectarBandeira('6362970000000000'), 'elo');
conferir('desconhecida', g.detectarBandeira('6011000000000000'), 'desconhecida');
conferir('vazio', g.detectarBandeira(''), 'desconhecida');
conferir('curto demais', g.detectarBandeira('45'), 'desconhecida');
conferir('com espacos', g.detectarBandeira('4539 5787 6362 1486'), 'visa');

/* ============ 3. validade (data injetada) ============ */
secao('validarValidade');
const AGORA = '2026-08-04T12:00:00Z';
conferir('mes corrente ainda vale', g.validarValidade('08/26', AGORA), true);
conferir('mes seguinte', g.validarValidade('09/26', AGORA), true);
conferir('ano seguinte', g.validarValidade('01/27', AGORA), true);
conferir('bem no futuro', g.validarValidade('12/30', AGORA), true);
conferir('mes passado esta vencido', g.validarValidade('07/26', AGORA), false);
conferir('ano passado esta vencido', g.validarValidade('08/25', AGORA), false);
conferir('dezembro do ano passado', g.validarValidade('12/25', AGORA), false);
conferir('mes 13 nao existe', g.validarValidade('13/26', AGORA), false);
conferir('mes 00 nao existe', g.validarValidade('00/26', AGORA), false);
conferir('sem zero a esquerda', g.validarValidade('8/26', AGORA), false);
conferir('separador errado', g.validarValidade('08-26', AGORA), false);
conferir('ano com 4 digitos', g.validarValidade('08/2026', AGORA), false);
conferir('vazio', g.validarValidade('', AGORA), false);
conferir('espacos em volta sao aparados', g.validarValidade(' 09/26 ', AGORA), true);
conferir('agora invalido recusa', g.validarValidade('09/26', 'nao e data'), false);
/* Determinismo: a mesma validade muda de veredito conforme a data injetada. */
conferir('mesma validade, outra data: vale', g.validarValidade('09/26', '2026-09-30T23:59:00Z'), true);
conferir('mesma validade, outra data: vencida', g.validarValidade('09/26', '2026-10-01T00:00:00Z'), false);

/* ============ 4. CVV ============ */
secao('validarCvv');
conferir('3 digitos em visa', g.validarCvv('123', 'visa'), true);
conferir('4 digitos em visa', g.validarCvv('1234', 'visa'), false);
conferir('4 digitos em amex', g.validarCvv('1234', 'amex'), true);
conferir('3 digitos em amex', g.validarCvv('123', 'amex'), false);
conferir('com letra', g.validarCvv('12a', 'visa'), false);
conferir('vazio', g.validarCvv('', 'visa'), false);
conferir('mastercard usa 3', g.validarCvv('123', 'mastercard'), true);
conferir('elo usa 3', g.validarCvv('123', 'elo'), true);
conferir('desconhecida usa 3', g.validarCvv('123', 'desconhecida'), true);

/* ============ 5. parcelas ============ */
secao('parcelasDisponiveis');
conferir('15900 cabe em 5', g.parcelasDisponiveis(15900), [1, 2, 3, 4, 5]);
conferir('44900 para no teto de 6', g.parcelasDisponiveis(44900), [1, 2, 3, 4, 5, 6]);
conferir('9000 cabe em 3', g.parcelasDisponiveis(9000), [1, 2, 3]);
conferir('6000 cabe em 2', g.parcelasDisponiveis(6000), [1, 2]);
conferir('3000 e o piso de 2x', g.parcelasDisponiveis(3000), [1]);
conferir('6000 exato ja da 2x', g.parcelasDisponiveis(6000).length, 2);
conferir('2999 so a vista', g.parcelasDisponiveis(2999), [1]);
conferir('total zero ainda oferece 1x', g.parcelasDisponiveis(0), [1]);
conferir('nunca devolve lista vazia', g.parcelasDisponiveis(1).length > 0, true);
conferir('valor altissimo nao passa de 6', g.parcelasDisponiveis(9999900), [1, 2, 3, 4, 5, 6]);

/* ============ 6. cartao ============ */
secao('processarCartao');
const dados = { numero: '4539578763621486', nome: 'YASMIM OLIVEIRA', validade: '09/26', cvv: '123', parcelas: 3 };
const aprovado = g.processarCartao(dados, 15900);
conferir('aprova por padrao', aprovado.status, 'aprovado');
conferir('metodo cartao', aprovado.metodo, 'cartao');
conferir('valor e o total', aprovado.valor, 15900);
conferir('guarda as parcelas', aprovado.parcelas, 3);
conferir('guarda so os 4 ultimos digitos', aprovado.ultimosDigitos, '1486');
conferir('guarda a bandeira', aprovado.bandeira, 'visa');
conferir('nao vaza pagoEm (quem sabe a hora e aplicarPagamento)', aprovado.pagoEm, undefined);

const recusado = g.processarCartao({ ...dados, numero: '4000000000000002' }, 28400);
conferir('cartao de teste e recusado', recusado.status, 'recusado');
conferir('recusado ainda guarda os 4 ultimos', recusado.ultimosDigitos, '0002');
conferir('recusado com espacos tambem', g.processarCartao({ ...dados, numero: '4000 0000 0000 0002' }, 100).status, 'recusado');
conferir('recusado com hifens tambem', g.processarCartao({ ...dados, numero: '4000-0000-0000-0002' }, 100).status, 'recusado');

/* A regra de segurança que mais importa: nada sensível sai no objeto. */
const chaves = Object.keys(aprovado).sort();
conferir('nenhum campo sensivel no Pagamento', chaves, ['bandeira', 'metodo', 'parcelas', 'status', 'ultimosDigitos', 'valor']);
const serializado = JSON.stringify(aprovado);
conferir('numero completo nao aparece', serializado.includes('4539578763621486'), false);
conferir('cvv nao aparece', serializado.includes('123') && serializado.includes('"cvv"'), false);
conferir('validade nao aparece', serializado.includes('09/26'), false);
conferir('nome nao aparece', serializado.includes('YASMIM'), false);

/* ============ 7. PIX ============ */
secao('gerarCobrancaPix');
const pix = g.gerarCobrancaPix(32736, AGORA);
conferir('status pendente', pix.status, 'pendente');
conferir('metodo pix', pix.metodo, 'pix');
conferir('sempre 1 parcela', pix.parcelas, 1);
conferir('valor e o total', pix.valor, 32736);
conferir('usa a chave ficticia dos mocks', pix.chavePix, chavePixLoja);
conferir('expira em 30 min', pix.expiraEm, '2026-08-04T12:30:00.000Z');
conferir('payload comeca como EMV falso', pix.payloadPix.startsWith('00020126FAKE'), true);
conferir('payload termina com 4 hex', /6304[0-9A-F]{4}$/.test(pix.payloadPix), true);
conferir('payload carrega o valor', pix.payloadPix.includes('54' + 32736), true);
conferir('nao tem pagoEm', pix.pagoEm, undefined);

conferir('determinismo: mesmas entradas, mesmo payload', g.gerarCobrancaPix(32736, AGORA).payloadPix, pix.payloadPix);
conferir('total diferente muda o payload', g.gerarCobrancaPix(999, AGORA).payloadPix !== pix.payloadPix, true);
conferir('hora diferente muda o payload', g.gerarCobrancaPix(32736, '2026-08-04T13:00:00Z').payloadPix !== pix.payloadPix, true);
conferir('hora diferente muda a expiracao', g.gerarCobrancaPix(32736, '2026-08-04T13:00:00Z').expiraEm, '2026-08-04T13:30:00.000Z');

encerrar();
