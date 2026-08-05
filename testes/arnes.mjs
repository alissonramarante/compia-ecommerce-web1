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
