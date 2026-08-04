import { carregarModulo } from './arnes.mjs';

const { criarControladorDeCampo } = await carregarModulo('src/lib/campoDebounced.ts', 'campoDebounced');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const ATRASO = 20;

function novo(valorInicial = '') {
  const escritas = [];
  const c = criarControladorDeCampo((e) => escritas.push(e), valorInicial, ATRASO);
  return { c, escritas };
}

let falhas = 0;
const conferir = (nome, obtido, esperado) => {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log((ok ? 'ok    ' : 'FALHA ') + nome.padEnd(52) + JSON.stringify(obtido) + (ok ? '' : '   esperado ' + JSON.stringify(esperado)));
};

// 1. Digitação incremental NÃO empilha histórico: 10 teclas -> 1 escrita, empilhar false
{
  const { c, escritas } = novo('');
  for (const t of ['m','ma','mat','mate','matem','matema','matemat','matemati','matematic','matematica']) c.digitar(t);
  await esperar(ATRASO * 4);
  conferir('10 teclas -> 1 escrita', escritas.length, 1);
  conferir('10 teclas -> nenhuma empilha', escritas.filter((e) => e.empilhar).length, 0);
  conferir('10 teclas -> valor final', escritas[0], { valor: 'matematica', empilhar: true === false ? '' : false });
}

// 2. Enter/blur empilha
{
  const { c, escritas } = novo('');
  c.digitar('m'); c.digitar('ma'); c.digitar('mat');
  c.confirmar('mat');
  await esperar(ATRASO * 4);
  conferir('confirmar cancela o pendente', escritas.length, 1);
  conferir('confirmar empilha', escritas[0], { valor: 'mat', empilhar: true });
}

// 3. Digitar, pausar (aplica), depois confirmar o mesmo texto
{
  const { c, escritas } = novo('');
  c.digitar('ia');
  await esperar(ATRASO * 4);
  c.confirmar('ia');
  conferir('confirmar sem mudanca nao reescreve', escritas.length, 1);
  conferir('a unica escrita foi a do debounce', escritas[0].empilhar, false);
}

// 4. Blur + submit do botao "Buscar" (mesmo texto duas vezes) -> uma escrita só
{
  const { c, escritas } = novo('');
  c.confirmar('ia');
  c.confirmar('ia');
  conferir('blur+submit -> 1 entrada de historico', escritas.length, 1);
}

// 5. Voltar ao valor original antes do debounce
{
  const { c, escritas } = novo('ia');
  c.digitar('ian'); c.digitar('ia');
  await esperar(ATRASO * 4);
  conferir('digitar e desfazer nao escreve', escritas.length, 0);
}

// 6. Desmonte cancela o pendente
{
  const { c, escritas } = novo('');
  c.digitar('mat');
  c.descartar();
  await esperar(ATRASO * 4);
  conferir('descartar cancela o pendente', escritas.length, 0);
}

// 7. Sincronizacao externa (voltar / limpar filtros)
{
  const { c, escritas } = novo('');
  c.sincronizar('ia');
  c.confirmar('ia');
  await esperar(ATRASO * 4);
  conferir('sincronizar realinha a referencia', escritas.length, 0);
}

// 8. Sincronizacao cancela debounce em voo
{
  const { c, escritas } = novo('');
  c.digitar('mat');
  c.sincronizar('');
  await esperar(ATRASO * 4);
  conferir('sincronizar cancela o pendente', escritas.length, 0);
}

console.log('\n' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
