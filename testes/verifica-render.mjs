import { carregarArnes, criarPlacar } from './arnes.mjs';
const { renderizarComProvedores } = await carregarArnes();
const render = (url) => renderizarComProvedores(url);


const casos = [
  ['/catalogo',                      'contagem total',        (h) => h.includes('>10</!-- -->')||/10<!-- --> <!-- -->t.tulos/.test(h)||h.includes('10') && /t.tulos/.test(h)],
  ['/catalogo',                      'selo Esgotado',         (h) => h.includes('Esgotado')],
  ['/catalogo',                      'selo de desconto -16%', (h) => h.includes('16%')],
  ['/catalogo',                      'selo Ultimas unidades', (h) => /ltimas unidades/.test(h)],
  ['/catalogo',                      'preco promocional R$ 159,00', (h) => h.includes('R$ 159,00')],
  ['/catalogo',                      'preco cheio riscado',   (h) => h.includes('line-through') && h.includes('R$ 189,00')],
  ['/catalogo',                      'capa dessaturada',      (h) => h.includes('grayscale')],
  ['/catalogo',                      'aria-live na contagem', (h) => h.includes('aria-live="polite"')],
  ['/catalogo',                      'alt descritivo',        (h) => h.includes('alt="Capa de Fundamentos de Aprendizado Profundo, de Helena Vasconcelos, Rui Amorim"')],
  ['/catalogo',                      'etiqueta E-book',       (h) => h.includes('E-book')],
  ['/catalogo',                      'sem Limpar filtros',    (h) => !h.includes('Limpar filtros')],
  ['/catalogo?tipo=ebook',           'Limpar filtros aparece',(h) => h.includes('Limpar filtros')],
  ['/catalogo?busca=zzz',            'estado vazio',          (h) => /Nenhum t.tulo para/.test(h)],
  ['/catalogo?busca=zzz',            'saida no estado vazio', (h) => h.includes('Limpar filtros')],
  ['/catalogo?categoria=inexistente','vazio sem busca',       (h) => /Nenhum t.tulo com esses filtros/.test(h)],
  ['/catalogo?visao=categorias',     'grade de categorias',   (h) => h.includes('Intelig') && h.includes('Blockchain') && h.includes('Criptografia')],
  ['/catalogo?visao=categorias',     'link para ?categoria=', (h) => h.includes('/catalogo?categoria=blockchain')],
  ['/catalogo?visao=categorias',     'sem grade de produtos', (h) => !h.includes('Esgotado')],
  ['/catalogo?ordem=menor_preco',    'select reflete a URL',  (h) => /<option selected[^>]*value="menor_preco"|value="menor_preco"[^>]*selected/.test(h)],
  ['/catalogo?categoria=criptografia','checkbox marcado',     (h) => /id="categoria-criptografia"[^>]*checked|checked[^>]*id="categoria-criptografia"/.test(h)],
  ['/catalogo?precoMin=50',          'campo preco preenchido',(h) => /id="precoMin"[^>]*value="50"|value="50"[^>]*id="precoMin"/.test(h)],
  ['/catalogo?tipo=ebook&categoria=criptografia&estoque=1', 'contador de filtros ativos', (h) => h.includes('>3</span>')],
];

// contagens exatas via extração do texto da contagem
function contagem(html) {
  const m = html.match(/aria-live="polite"[^>]*>(\d+)/);
  return m ? Number(m[1]) : null;
}
const contagens = [
  ['/catalogo', 10], ['/catalogo?tipo=ebook', 4], ['/catalogo?tipo=ebook&tipo=kit', 5],
  ['/catalogo?busca=matematica', 1], ['/catalogo?categoria=didaticos', 4],
  ['/catalogo?estoque=1', 9], ['/catalogo?precoMin=200', 2], ['/catalogo?busca=zzz', 0],
];

let falhas = 0;
for (const [url, nome, checa] of casos) {
  let ok = false, erro = '';
  try { ok = checa(render(url)); } catch (e) { erro = ' [' + e.message + ']'; }
  if (!ok) falhas++;
  console.log((ok ? 'ok    ' : 'FALHA ') + url.padEnd(42) + nome + erro);
}
console.log('');
for (const [url, esperado] of contagens) {
  const obtido = contagem(render(url));
  const ok = obtido === esperado;
  if (!ok) falhas++;
  console.log((ok ? 'ok    ' : 'FALHA ') + url.padEnd(42) + 'contagem ' + obtido + (ok ? '' : ' esperado ' + esperado));
}
// singular/plural: o texto exato dentro da regiao aria-live
function textoDaContagem(url) {
  const m = render(url).match(new RegExp(String.raw`aria-live="polite"[^>]*>(.*?)</p>`));
  return m ? m[1] : '';
}
for (const [url, esperado] of [['/catalogo?busca=matematica', '1 título'], ['/catalogo', '10 títulos']]) {
  const obtido = textoDaContagem(url);
  const ok = obtido === esperado;
  if (!ok) falhas++;
  console.log((ok ? 'ok    ' : 'FALHA ') + url.padEnd(42) + 'texto ' + JSON.stringify(obtido));
}

console.log('\n' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
