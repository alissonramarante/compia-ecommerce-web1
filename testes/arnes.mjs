import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Infraestrutura comum das suítes.
 *
 * Tudo é resolvido a partir da localização deste arquivo, nunca de caminho
 * absoluto: num clone limpo `npm install && npm run testes` tem que passar.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
export const RAIZ = dirname(AQUI);

/** Bundles intermediários. Ignorado pelo git. */
const CACHE = join(AQUI, '.cache');

const exigir = createRequire(pathToFileURL(join(RAIZ, 'package.json')).href);
const { build } = exigir('esbuild');

/** Caminho absoluto a partir da raiz do projeto. */
export function doProjeto(...partes) {
  return join(RAIZ, ...partes);
}

const OPCOES_COMUNS = {
  bundle: true,
  platform: 'node',
  jsx: 'automatic',
  nodePaths: [join(RAIZ, 'node_modules')],
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'silent',
};

/**
 * Compila e carrega um módulo do projeto. `entrada` é relativa à raiz, como
 * `'src/lib/carrinho.ts'`.
 */
export async function carregarModulo(entrada, nome) {
  const saida = join(CACHE, `${nome}.mjs`);

  await build({ ...OPCOES_COMUNS, entryPoints: [doProjeto(entrada)], format: 'esm', outfile: saida });

  return import(pathToFileURL(saida).href);
}

/**
 * Compila e carrega o arnês de renderização.
 *
 * Formato CJS porque `react-dom/server` faz `require('stream')` internamente,
 * e o bundle ESM do esbuild rejeita require dinâmico.
 */
export async function carregarArnes() {
  const saida = join(CACHE, 'arnes.cjs');

  await build({ ...OPCOES_COMUNS, entryPoints: [join(AQUI, 'arnes.tsx')], format: 'cjs', outfile: saida });

  return exigir(saida);
}

/**
 * Confere se todo `id="..."` de um HTML renderizado é único — o defeito da
 * Fatia 4 (dois campos com o mesmo id, `<label>` associado ao errado) não
 * pode voltar.
 *
 * A fronteira de palavra antes de `id=` importa: sem ela, `aria-invalid`,
 * `aria-describedby` etc. combinam pela cauda (`...val`**`id="false"`**`...`)
 * e o valor de um atributo booleano vira uma "colisão de id" inventada.
 *
 * Testes de mesa:
 *   um só id                                    → true
 *   dois ids diferentes                         → true
 *   aria-invalid="false" sem id repetido de verdade → true (não é falso positivo)
 *   dois `id="mesmo"`                            → false
 *   id repetido escondido atrás de aria-describedby → false (detecta mesmo com atributo-armadilha no meio)
 */
export function idsSaoUnicos(html) {
  const ids = html.match(/(?<![a-zA-Z-])id="[^"]+"/g) ?? [];
  return new Set(ids).size === ids.length;
}

/**
 * Tokens de cor do tema — precisa ficar em sincronia com `tailwind.config.js`.
 * Duplicado aqui de propósito: o config do Tailwind não é importável por um
 * teste Node puro sem trazer o Tailwind inteiro como dependência de teste, e
 * o objetivo aqui é validar contraste com a fórmula exata, não estimar.
 */
export const TOKENS = {
  tinta: '#101418',
  papel: '#EEF0EA',
  azul: '#23319E',
  riso: '#FF4F7B',
  ocre: '#D9A521',
  grafite: '#5C6670',
  'riso-texto': '#BE3A5C',
  'ocre-texto': '#8A6414',
  white: '#FFFFFF',
  black: '#000000',
};

function paraLinear(canal) {
  const c = canal / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminanciaRelativa(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * paraLinear(r) + 0.7152 * paraLinear(g) + 0.0722 * paraLinear(b);
}

/**
 * Razão de contraste WCAG entre duas cores hex — fórmula exata (luminância
 * relativa + (L1+0.05)/(L2+0.05) com o par ordenado do mais claro pro mais
 * escuro), não uma estimativa visual.
 *
 * Testes de mesa:
 *   razaoDeContraste('#FFFFFF', '#000000') → 21   (máximo possível)
 *   razaoDeContraste('#101418', '#EEF0EA') → ~16.1 (tinta sobre papel)
 *   razaoDeContraste('#FF4F7B', '#EEF0EA') → ~2.75 (riso sobre papel, abaixo do mínimo)
 *   ordem dos argumentos não importa (comutativa)
 */
export function razaoDeContraste(hexA, hexB) {
  const lA = luminanciaRelativa(hexA);
  const lB = luminanciaRelativa(hexB);
  const maisClaro = Math.max(lA, lB);
  const maisEscuro = Math.min(lA, lB);
  return (maisClaro + 0.05) / (maisEscuro + 0.05);
}

/** Placar compartilhado: conta falhas e define o código de saída. */
export function criarPlacar() {
  let falhas = 0;

  return {
    caso(nome, ok) {
      if (!ok) falhas++;
      console.log((ok ? 'ok    ' : 'FALHA ') + nome);
    },
    conferir(nome, obtido, esperado) {
      const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
      if (!ok) falhas++;
      console.log(
        (ok ? 'ok    ' : 'FALHA ') +
          nome.padEnd(48) +
          JSON.stringify(obtido) +
          (ok ? '' : '  esperado ' + JSON.stringify(esperado)),
      );
    },
    secao(titulo) {
      console.log('\n--- ' + titulo + ' ---');
    },
    encerrar() {
      console.log('\n' + falhas + ' falha(s)');
      process.exit(falhas === 0 ? 0 : 1);
    },
  };
}
