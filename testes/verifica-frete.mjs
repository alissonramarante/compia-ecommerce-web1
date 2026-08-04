import { carregarModulo, criarPlacar } from './arnes.mjs';

const f = await carregarModulo('src/lib/frete.ts', 'frete');
const { produtos } = await carregarModulo('src/mocks/produtos.ts', 'produtos');

const { conferir, secao, encerrar } = criarPlacar();

const p = (id) => produtos.find((x) => x.id === id);
/** Monta itens com o preço vigente real, como o carrinho faria. */
const carrinho = (...pares) =>
  pares.map(([id, quantidade]) => ({
    produtoId: id,
    quantidade,
    precoUnitario: p(id).precoPromocional ?? p(id).preco,
  }));

/* ============ 1. validarCep ============ */
secao('validarCep');
conferir('com hifen', f.validarCep('58429-140'), true);
conferir('sem hifen', f.validarCep('58429140'), true);
conferir('com espacos em volta', f.validarCep(' 58429140 '), true);
conferir('hifen fora de lugar', f.validarCep('5842-9140'), false);
conferir('curto demais', f.validarCep('584291'), false);
conferir('longo demais', f.validarCep('584291401'), false);
conferir('com letra', f.validarCep('58429-14a'), false);
conferir('vazio', f.validarCep(''), false);
conferir('so pontuacao', f.validarCep('-'), false);

/* ============ 2. faixaDoCep ============ */
secao('faixaDoCep');
conferir('58 = Paraiba', f.faixaDoCep('58429-140').regiao, 'Paraíba');
conferir('01 = Sao Paulo', f.faixaDoCep('01310-200').regiao, 'São Paulo');
conferir('40 = Bahia', f.faixaDoCep('40140130').regiao, 'Bahia');
conferir('69 = Amazonas', f.faixaDoCep('69000-000').regiao, 'Amazonas');
conferir('faixa desconhecida cai no padrao', f.faixaDoCep('99999-999').regiao, 'Demais localidades');
conferir('cep vazio cai no padrao', f.faixaDoCep('').regiao, 'Demais localidades');
conferir('cep invalido cai no padrao', f.faixaDoCep('abc').regiao, 'Demais localidades');
conferir('padrao tem prazo de 10 dias', f.faixaDoCep('99999-999').prazoDiasUteis, 10);

/* ============ 3. calcularFrete: base ============ */
secao('calcularFrete');
const umLivro = carrinho(['prod-001', 1]);           // 980 g -> 1 kg, subtotal 15900
const opcoes = f.calcularFrete('58429-140', umLivro, produtos);
conferir('devolve duas opcoes', opcoes.length, 2);
conferir('ids das opcoes', opcoes.map((o) => o.id), ['frete-padrao', 'frete-expresso']);
conferir('padrao = taxaFixa + custoPorKg x 1', opcoes[0].valor, 2100);
conferir('padrao usa o prazo da faixa', opcoes[0].prazoDiasUteis, 2);
conferir('expresso = padrao x 1,8', opcoes[1].valor, 3780);
conferir('expresso divide o prazo, piso 1', opcoes[1].prazoDiasUteis, 1);
conferir('transportadora padrao', opcoes[0].transportadora, 'Correios — PAC');
conferir('transportadora expressa', opcoes[1].transportadora, 'Correios — SEDEX');

/* Arredondamento precisa de um caso abaixo do frete grátis, senão a
   gratuidade mascara o cálculo. prod-006: 690 g x 2 = 1380 g -> 2 kg,
   subtotal 28400 < 30000. */
const doisMagros = carrinho(['prod-006', 2]);
conferir('1380 g arredonda para 2 kg', f.calcularFrete('58429-140', doisMagros, produtos)[0].valor, 3000);
conferir('e o expresso acompanha', f.calcularFrete('58429-140', doisMagros, produtos)[1].valor, 5400);
/* 1 g já conta como 1 kg inteiro: a faixa é por quilo iniciado. */
conferir('peso minimo ja paga 1 kg', f.calcularFrete('58429-140', [{ produtoId: 'prod-001', quantidade: 1, precoUnitario: 100 }], produtos)[0].valor, 2100);

/* ============ 4. frete gratis ============ */
secao('frete gratis nao contamina o expresso');
const acimaDoLimite = carrinho(['prod-009', 1]);     // kit 2730 g -> 3 kg, subtotal 44900
const gratis = f.calcularFrete('01310-200', acimaDoLimite, produtos);
conferir('padrao zerada', gratis[0].valor, 0);
conferir('expresso segue paga', gratis[1].valor, 11520);
conferir('expresso calculado sobre a base, nao sobre zero', gratis[1].valor > 0, true);
conferir('prazo da padrao intacto', gratis[0].prazoDiasUteis, 6);
conferir('prazo do expresso dividido', gratis[1].prazoDiasUteis, 3);

const abaixoDoLimite = carrinho(['prod-006', 1]);    // 690 g -> 1 kg, subtotal 14200
conferir('abaixo do limite a padrao e cobrada', f.calcularFrete('01310-200', abaixoDoLimite, produtos)[0].valor, 3400);

/* limite exato: prod-002 (21500) + prod-006 (14200) = 35700 */
conferir('exatamente no limite ja e gratis', f.calcularFrete('58429-140', carrinho(['prod-002', 1], ['prod-006', 1]), produtos)[0].valor, 0);

/* ============ 5. sem despacho ============ */
secao('pedido sem peso');
conferir('so e-book devolve []', f.calcularFrete('58429-140', carrinho(['prod-005', 1]), produtos), []);
conferir('dois e-books tambem', f.calcularFrete('58429-140', carrinho(['prod-005', 1], ['prod-003', 1]), produtos), []);
conferir('carrinho vazio devolve []', f.calcularFrete('58429-140', [], produtos), []);
conferir('e-book + fisico volta a ter frete', f.calcularFrete('58429-140', carrinho(['prod-005', 1], ['prod-001', 1]), produtos).length, 2);
conferir('e-book nao soma peso', f.calcularFrete('58429-140', carrinho(['prod-005', 1], ['prod-001', 1]), produtos)[0].valor, 2100);

/* ============ 6. faixa desconhecida ============ */
secao('faixa desconhecida');
const remoto = f.calcularFrete('99999-999', umLivro, produtos);
conferir('usa taxa da faixa padrao', remoto[0].valor, 2200 + 1800);
conferir('usa prazo da faixa padrao', remoto[0].prazoDiasUteis, 10);
conferir('expresso do padrao', remoto[1].valor, Math.round((2200 + 1800) * 1.8));
conferir('prazo expresso do padrao', remoto[1].prazoDiasUteis, 5);

/* ============ 7. pureza ============ */
secao('pureza');
conferir('nao muta os itens', (() => { const itens = carrinho(['prod-001', 1]); f.calcularFrete('58429-140', itens, produtos); return itens[0].quantidade; })(), 1);
conferir('chamadas iguais dao resultados iguais', JSON.stringify(f.calcularFrete('58429-140', umLivro, produtos)) === JSON.stringify(f.calcularFrete('58429-140', umLivro, produtos)), true);

encerrar();
