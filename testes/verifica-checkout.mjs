import { carregarModulo, criarPlacar } from './arnes.mjs';

const ck = await carregarModulo('src/lib/checkout.ts', 'checkout');
const pg = await carregarModulo('src/lib/pagamento.ts', 'pagamentoParaCheckout');
const pd = await carregarModulo('src/lib/pedido.ts', 'pedidoParaCheckout');
const { clientes } = await carregarModulo('src/mocks/clientes.ts', 'clientes');
const { pedidos } = await carregarModulo('src/mocks/pedidos.ts', 'pedidosMock');

const { conferir, secao, encerrar } = criarPlacar();

const AGORA = '2026-08-04T12:00:00Z';
const endereco = clientes[0].enderecos[0];
const cartaoBom = { numero: '4539 5787 6362 1486', nome: 'YASMIM OLIVEIRA', validade: '09/26', cvv: '123', parcelas: 1 };
const cartaoVazio = { numero: '', nome: '', validade: '', cvv: '', parcelas: 1 };

const estado = (patch = {}) => ({
  endereco,
  modalidade: 'envio',
  opcaoFreteId: null,
  metodo: null,
  cartao: cartaoVazio,
  ...patch,
});

/* ============ 1. passos visíveis ============ */
secao('passosVisiveis');
conferir('entrega por envio tem os 4', ck.passosVisiveis(true, 'envio'), [1, 2, 3, 4]);
conferir('retirada nao tem frete', ck.passosVisiveis(true, 'retirada'), [1, 3, 4]);
conferir('so e-book pula endereco e frete', ck.passosVisiveis(false, 'download'), [3, 4]);
conferir('sem peso a modalidade nao importa', ck.passosVisiveis(false, 'envio'), [3, 4]);

/* ============ 2. endereço ============ */
secao('errosDoEndereco');
conferir('endereco do cli-001 e valido', ck.errosDoEndereco(endereco), {});
conferir('cep curto', Object.keys(ck.errosDoEndereco({ ...endereco, cep: '584' })), ['cep']);
conferir('cep sem hifen vale', ck.errosDoEndereco({ ...endereco, cep: '58429140' }), {});
conferir('logradouro vazio', Object.keys(ck.errosDoEndereco({ ...endereco, logradouro: '  ' })), ['logradouro']);
conferir('numero vazio', Object.keys(ck.errosDoEndereco({ ...endereco, numero: '' })), ['numero']);
conferir('uf com 3 letras', Object.keys(ck.errosDoEndereco({ ...endereco, uf: 'PBB' })), ['uf']);
conferir('uf com numero', Object.keys(ck.errosDoEndereco({ ...endereco, uf: 'P1' })), ['uf']);
conferir('tudo vazio da 6 erros', Object.keys(ck.errosDoEndereco({ ...endereco, cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '' })).length, 6);
conferir('complemento e opcional', ck.errosDoEndereco({ ...endereco, complemento: '' }), {});
conferir('erro do cep diz como resolver', ck.errosDoEndereco({ ...endereco, cep: '1' }).cep, 'CEP inválido. São 8 dígitos, como 58429-140.');

/* ============ 3. cartão ============ */
secao('errosDoCartao');
conferir('cartao valido', ck.errosDoCartao(cartaoBom, AGORA), {});
conferir('cartao de teste e valido (recusa e do processamento)', ck.errosDoCartao({ ...cartaoBom, numero: '4000000000000002' }, AGORA), {});
conferir('numero que falha no Luhn', Object.keys(ck.errosDoCartao({ ...cartaoBom, numero: '4539578763621487' }, AGORA)), ['numero']);
conferir('nome vazio', Object.keys(ck.errosDoCartao({ ...cartaoBom, nome: '   ' }, AGORA)), ['nome']);
conferir('validade vencida', Object.keys(ck.errosDoCartao({ ...cartaoBom, validade: '07/26' }, AGORA)), ['validade']);
conferir('cvv curto', Object.keys(ck.errosDoCartao({ ...cartaoBom, cvv: '12' }, AGORA)), ['cvv']);
conferir('cvv de 3 na amex', Object.keys(ck.errosDoCartao({ numero: '378282246310005', nome: 'A', validade: '09/26', cvv: '123', parcelas: 1 }, AGORA)), ['cvv']);
conferir('mensagem da amex e propria', ck.errosDoCartao({ numero: '378282246310005', nome: 'A', validade: '09/26', cvv: '123', parcelas: 1 }, AGORA).cvv, 'CVV da Amex tem 4 dígitos.');
conferir('cartao em branco da 4 erros', Object.keys(ck.errosDoCartao(cartaoVazio, AGORA)).length, 4);

/* ============ 4. liberação de passo ============ */
secao('primeiroPassoPendente');
conferir('nada preenchido, com entrega', ck.primeiroPassoPendente(estado({ endereco: { ...endereco, cep: '' } }), true, AGORA), 1);
conferir('endereco ok, sem frete', ck.primeiroPassoPendente(estado(), true, AGORA), 2);
conferir('endereco e frete ok, sem meio', ck.primeiroPassoPendente(estado({ opcaoFreteId: 'frete-padrao' }), true, AGORA), 3);
conferir('pix escolhido libera a confirmacao', ck.primeiroPassoPendente(estado({ opcaoFreteId: 'frete-padrao', metodo: 'pix' }), true, AGORA), 4);
conferir('cartao incompleto trava no 3', ck.primeiroPassoPendente(estado({ opcaoFreteId: 'frete-padrao', metodo: 'cartao' }), true, AGORA), 3);
conferir('cartao completo libera o 4', ck.primeiroPassoPendente(estado({ opcaoFreteId: 'frete-padrao', metodo: 'cartao', cartao: cartaoBom }), true, AGORA), 4);
conferir('so e-book comeca no 3', ck.primeiroPassoPendente(estado(), false, AGORA), 3);
conferir('retirada pula o frete', ck.primeiroPassoPendente(estado({ modalidade: 'retirada' }), true, AGORA), 3);
conferir('retirada nao exige endereco', ck.primeiroPassoPendente(estado({ modalidade: 'retirada', endereco: { ...endereco, cep: '', logradouro: '' } }), true, AGORA), 3);

secao('passoPermitido');
conferir('pedir 3 com endereco pendente cai no 1', ck.passoPermitido(3, estado({ endereco: { ...endereco, cep: '' } }), true, AGORA), 1);
conferir('pedir 4 sem frete cai no 2', ck.passoPermitido(4, estado(), true, AGORA), 2);
conferir('pedir 4 com tudo pronto passa', ck.passoPermitido(4, estado({ opcaoFreteId: 'frete-padrao', metodo: 'pix' }), true, AGORA), 4);
conferir('pedir 1 estando adiante e permitido (voltar)', ck.passoPermitido(1, estado({ opcaoFreteId: 'frete-padrao', metodo: 'pix' }), true, AGORA), 1);
conferir('passo inexistente no fluxo cai no pendente', ck.passoPermitido(2, estado(), false, AGORA), 3);
conferir('passo 9 cai no pendente', ck.passoPermitido(9, estado(), true, AGORA), 2);
conferir('passo 0 cai no pendente', ck.passoPermitido(0, estado(), true, AGORA), 2);
conferir('NaN (de ?passo=abc) cai no pendente', ck.passoPermitido(NaN, estado(), true, AGORA), 2);

/* ============ 5. máscaras ============ */
secao('mascaras');
conferir('agrupa de 4 em 4', ck.formatarNumeroDeCartao('4539578763621486'), '4539 5787 6362 1486');
conferir('idempotente', ck.formatarNumeroDeCartao('4539 5787 6362 1486'), '4539 5787 6362 1486');
conferir('aceita colar com hifen', ck.formatarNumeroDeCartao('4539-5787-6362-1486'), '4539 5787 6362 1486');
conferir('aceita colar com espacos irregulares', ck.formatarNumeroDeCartao(' 4539  57 87 6362 1486 '), '4539 5787 6362 1486');
conferir('amex agrupa 4-6-5', ck.formatarNumeroDeCartao('378282246310005'), '3782 822463 10005');
conferir('parcial nao ganha espaco a toa', ck.formatarNumeroDeCartao('4539'), '4539');
conferir('vazio', ck.formatarNumeroDeCartao(''), '');
conferir('corta em 19 digitos', ck.formatarNumeroDeCartao('45395787636214861234').replace(/ /g, '').length, 19);
conferir('validade insere a barra', ck.formatarValidade('0926'), '09/26');
conferir('validade idempotente', ck.formatarValidade('09/26'), '09/26');
conferir('validade parcial', ck.formatarValidade('09'), '09');
conferir('validade com 3 digitos', ck.formatarValidade('092'), '09/2');
conferir('validade corta o excedente', ck.formatarValidade('09262'), '09/26');
conferir('cvv so digitos', ck.formatarCvv('12a3'), '123');
conferir('cvv corta em 4', ck.formatarCvv('12345'), '1234');

/* ============ 6. textos ============ */
secao('textos');
conferir('aviso de checkout abortado nomeia o cliente', ck.mensagemDeCheckoutAbortado('Larissa Fontes'), 'O checkout foi reiniciado porque a sessão mudou para Larissa Fontes. Este é o carrinho dela.');
conferir('erro de recusa diz que nada foi cobrado', ck.ERRO_DE_CARTAO_RECUSADO.includes('Nada foi cobrado'), true);
conferir('erro de recusa oferece saida', ck.ERRO_DE_CARTAO_RECUSADO.includes('PIX'), true);

/* ============ 7. cobrança PIX vencida ============ */
secao('cobrancaExpirada');
const pixDeTeste = pg.gerarCobrancaPix(32736, '2026-02-26T11:30:00Z'); // expira 12:00
conferir('antes do vencimento', pg.cobrancaExpirada(pixDeTeste, '2026-02-26T11:59:00Z'), false);
conferir('no minuto do vencimento ja venceu', pg.cobrancaExpirada(pixDeTeste, '2026-02-26T12:00:00Z'), true);
conferir('depois do vencimento', pg.cobrancaExpirada(pixDeTeste, AGORA), true);
conferir('ped-003 dos mocks esta vencido hoje', pg.cobrancaExpirada(pedidos[2].pagamento, AGORA), true);
conferir('PIX ja aprovado nao expira', pg.cobrancaExpirada({ ...pixDeTeste, status: 'aprovado' }, AGORA), false);
conferir('cartao nao expira', pg.cobrancaExpirada({ metodo: 'cartao', status: 'pendente', valor: 1, parcelas: 1 }, AGORA), false);
conferir('sem expiraEm nao expira', pg.cobrancaExpirada({ metodo: 'pix', status: 'pendente', valor: 1, parcelas: 1 }, AGORA), false);
conferir('agora invalido nao expira', pg.cobrancaExpirada(pixDeTeste, 'nao e data'), false);

secao('renovarCobrancaPix');
const renovado = pd.renovarCobrancaPix(pedidos[2], AGORA);
conferir('gera payload diferente', renovado.pagamento.payloadPix !== pedidos[2].pagamento.payloadPix, true);
conferir('nova expiracao 30 min a frente', renovado.pagamento.expiraEm, '2026-08-04T12:30:00.000Z');
conferir('continua pendente', renovado.pagamento.status, 'pendente');
conferir('mantem o total do pedido', renovado.pagamento.valor, pedidos[2].total);
conferir('status do pedido nao muda', renovado.status, 'aguardando_pagamento');
conferir('registra evento no historico', renovado.historico.length, pedidos[2].historico.length + 1);
conferir('observacao do evento', renovado.historico.at(-1).observacao, 'Cobrança PIX expirada. Nova cobrança gerada.');
conferir('evento datado', renovado.historico.at(-1).em, AGORA);
conferir('atualizadoEm', renovado.atualizadoEm, AGORA);
conferir('pedido original intacto', pedidos[2].pagamento.payloadPix, '00020126FAKEPIXPAYLOAD5204000053039865802BR6304EFGH');
conferir('a renovada nao esta vencida', pg.cobrancaExpirada(renovado.pagamento, AGORA), false);

encerrar();
