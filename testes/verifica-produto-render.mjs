import { carregarArnes, criarPlacar } from './arnes.mjs';
const { renderizarComProvedores } = await carregarArnes();
const render = (url) => renderizarComProvedores(url);


/* Conta percentuais no texto visível. Sobre o HTML cru daria falso positivo:
   as URLs das capas trazem %C3%A1 e afins. */
const percentuaisVisiveis = (html) =>
  (html.replace(/<[^>]*>/g, ' ').match(/\d+%/g) || []);

let falhas = 0;
const casos = [];
const caso = (slug, nome, checa) => casos.push([slug, nome, checa]);

/* --- prod-001: fisico com promocao --- */
const P1 = '/produto/fundamentos-de-aprendizado-profundo';
caso(P1, 'h1 e o titulo', (h) => /<h1[^>]*>Fundamentos de Aprendizado Profundo<\/h1>/.test(h));
caso(P1, 'subtitulo em <p>, nao heading', (h) => h.includes('Da regressão linear aos transformers') && !/<h[1-6][^>]*>Da regressão/.test(h));
caso(P1, 'trilha com aria-label', (h) => h.includes('aria-label="Você está aqui"'));
caso(P1, 'trilha: Inicio, Catalogo, categoria', (h) => h.includes('>Início<') && h.includes('>Catálogo<') && h.includes('/catalogo?categoria=inteligencia-artificial'));
caso(P1, 'trilha marca a pagina atual', (h) => h.includes('aria-current="page"'));
caso(P1, 'autor vira link de busca', (h) => h.includes('/catalogo?busca=Helena%20Vasconcelos'));
caso(P1, 'segundo autor tambem', (h) => h.includes('/catalogo?busca=Rui%20Amorim'));
caso(P1, 'preco vigente', (h) => h.includes('R$ 159,00'));
caso(P1, 'preco cheio riscado', (h) => h.includes('line-through') && h.includes('R$ 189,00'));
caso(P1, 'nao-kit: % diz contra o preco de tabela', (h) => h.includes('16% abaixo do preço de tabela'));
/* Em prod-001 os percentuais visíveis são: o selo da capa (−16%), a linha de
   preço (16%) — mesmo significado, sem ambiguidade — e o −18% do cartão do kit
   em "Relacionados", que é o selo da grade e deve continuar lá. */
caso(P1, 'nao-kit: nenhum % de significado divergente', (h) => {
  const visiveis = percentuaisVisiveis(h);
  return visiveis.filter((p) => p === '16%').length === 2 && visiveis.includes('18%');
});
caso(P1, 'alt com titulo e autor', (h) => h.includes('alt="Capa de Fundamentos de Aprendizado Profundo, de Helena Vasconcelos, Rui Amorim"'));
caso(P1, 'ficha catalografica presente', (h) => h.includes('catalogação na publicação'));
caso(P1, 'ficha e <dl> com dt/dd', (h) => h.includes('<dl') && h.includes('<dt') && h.includes('<dd'));
caso(P1, 'ficha traz ISBN e CDU', (h) => h.includes('978-85-7522-101-4') && h.includes('006.31'));
caso(P1, 'ficha traz autor e titulo', (h) => h.includes('Helena Vasconcelos; Rui Amorim'));
caso(P1, 'seletor de quantidade', (h) => h.includes('id="quantidade"'));
caso(P1, 'botao adicionar habilitado', (h) => h.includes('Adicionar ao carrinho') && !h.includes('aria-disabled'));
caso(P1, 'peso e aviso de frete', (h) => h.includes('Peso 980 g') && h.includes('frete calculado no checkout'));
caso(P1, 'tags linkam para ?tag=', (h) => h.includes('/catalogo?tag=deep%20learning'));
caso(P1, 'descricao com largura de leitura', (h) => h.includes('max-w-[65ch]'));
caso(P1, 'relacionados presente', (h) => h.includes('>Relacionados<'));
caso(P1, 'sem bloco de kit', (h) => !h.includes('O que vem no kit'));
caso(P1, 'sem bloco de e-book', (h) => !h.includes('Download liberado'));

/* --- prod-008: fisico esgotado --- */
const P8 = '/produto/engenharia-de-dados-para-ia';
caso(P8, 'selo Esgotado', (h) => h.includes('>Esgotado<'));
caso(P8, 'capa dessaturada', (h) => h.includes('grayscale'));
caso(P8, 'botao desabilitado com aria-disabled', (h) => h.includes('aria-disabled="true"') && h.includes('disabled'));
caso(P8, 'botao nao diz Adicionar', (h) => !h.includes('Adicionar ao carrinho'));
caso(P8, 'sem seletor de quantidade', (h) => !h.includes('id="quantidade"'));

/* --- prod-006: estoque 3 --- */
const P6 = '/produto/algoritmos-de-busca-e-planejamento';
caso(P6, 'selo Ultimas unidades', (h) => h.includes('Últimas unidades'));
caso(P6, 'mostra o estoque restante', (h) => h.includes('3 em estoque'));
caso(P6, 'teto do seletor e o estoque', (h) => /max="3"/.test(h));
caso(P6, 'botao habilitado', (h) => h.includes('Adicionar ao carrinho'));

/* --- prod-005: e-book com 3 formatos --- */
const P5 = '/produto/seguranca-de-modelos-de-linguagem';
caso(P5, 'etiqueta E-book', (h) => h.includes('E-book'));
caso(P5, 'tres formatos', (h) => h.includes('PDF · EPUB · MOBI'));
caso(P5, 'aviso de download sem frete', (h) => h.includes('Download liberado') && h.includes('Sem frete'));
caso(P5, 'sem seletor de quantidade', (h) => !h.includes('id="quantidade"'));
caso(P5, 'sem peso nem frete', (h) => !h.includes('frete calculado no checkout'));
caso(P5, 'tem ficha catalografica', (h) => h.includes('catalogação na publicação'));

/* --- prod-009: kit --- */
const P9 = '/produto/kit-trilha-ia-aplicada';
caso(P9, 'lista os 3 titulos do kit', (h) => h.includes('/produto/fundamentos-de-aprendizado-profundo') && h.includes('/produto/arquitetura-de-sistemas-inteligentes') && h.includes('/produto/engenharia-de-dados-para-ia'));
caso(P9, 'economia explicitada em texto', (h) => h.includes('R$ 573,00') && h.includes('R$ 449,00') && h.includes('R$ 124,00') && h.includes('22%'));
caso(P9, 'SEM ficha catalografica', (h) => !h.includes('catalogação na publicação'));
caso(P9, 'sem moldura de ficha vazia', (h) => !h.includes('<dl'));
caso(P9, 'peso e frete (kit e despachado)', (h) => h.includes('Peso 2730 g'));

caso(P9, 'kit NAO tem selo de % na capa', (h) => !h.includes('−18%'));
caso(P9, 'kit NAO tem % solto na linha de preco', (h) => !h.includes('abaixo do preço de tabela'));
caso(P9, 'kit mantem o preco de tabela riscado', (h) => h.includes('line-through') && h.includes('R$ 546,00'));
caso(P9, 'unico % do kit diz contra o que', (h) => h.includes('22% abaixo da compra separada'));
caso(P9, 'R$ 573,00 rotulado como soma dos avulsos', (h) => h.includes('A soma dos três avulsos hoje é') && h.includes('R$ 573,00'));
caso(P9, 'R$ 546,00 rotulado como tabela do kit', (h) => h.includes('preço de tabela do kit'));
caso(P9, 'nenhum valor de referencia sem rotulo', (h) => {
  const texto = h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  return /preço de tabela do kit/.test(texto) && /soma dos três avulsos hoje é R\$ 573,00/.test(texto);
});
caso(P9, 'um unico % visivel na pagina do kit', (h) => percentuaisVisiveis(h).length === 1);
caso(P9, 'e esse % e o comparativo', (h) => percentuaisVisiveis(h)[0] === '22%');
caso(P9, 'descricao do mock sem numero', (h) => h.includes('por menos que a soma dos três avulsos') && !h.includes('18% de desconto'));

/* --- prod-001 segue com o selo, que la e o unico % --- */
caso(P1, 'nao-kit mantem o % com referencia', (h) => h.includes('16% abaixo do preço de tabela'));

/* --- prod-007: revista, autoria coletiva (adendo 1) --- */
const P7 = '/produto/revista-compia-01-agentes';
caso(P7, 'autoria coletiva NAO produz <a>', (h) => !/<a[^>]*>Vários autores<\/a>/.test(h));
caso(P7, 'autoria coletiva aparece como texto', (h) => h.includes('Vários autores'));
caso(P7, 'nenhum link ?busca= na pagina', (h) => !h.includes('/catalogo?busca='));
caso(P7, 'sem ficha (revista nao tem)', (h) => !h.includes('catalogação na publicação'));

/* --- slug inexistente --- */
const PX = '/produto/nao-existe-mesmo';
caso(PX, 'mensagem propria, sem redirect', (h) => h.includes('Não encontramos este título.'));
caso(PX, 'oferece o catalogo', (h) => h.includes('/catalogo') && h.includes('Ver catálogo'));
caso(PX, 'nao renderiza produto', (h) => !h.includes('Adicionar ao carrinho'));

for (const [slug, nome, checa] of casos) {
  let ok = false;
  let erro = '';
  try {
    ok = checa(render(slug));
  } catch (e) {
    erro = ' [' + e.message + ']';
  }
  if (!ok) falhas++;
  console.log((ok ? 'ok    ' : 'FALHA ') + slug.replace('/produto/', '').padEnd(36) + nome + erro);
}
console.log('\n' + casos.length + ' casos, ' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
