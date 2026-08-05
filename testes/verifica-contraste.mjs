import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, TOKENS, razaoDeContraste, criarPlacar } from './arnes.mjs';

const { conferir, caso, secao, encerrar } = criarPlacar();

/**
 * Contraste, calculado pela fórmula WCAG (luminância relativa), não
 * estimado. Mínimos: 4.5:1 para texto normal, 3:1 para texto grande e
 * componentes de interface.
 *
 * "Cor saturada preenche, cor escura escreve" — ver CLAUDE.md § Direção
 * visual: `riso`/`ocre` só valem como `bg-*` com `text-tinta` por cima;
 * `riso-texto`/`ocre-texto` são as versões escurecidas para `text-*` direto
 * sobre fundo claro.
 */

const MINIMO_TEXTO = 4.5;

/* ============ 1. Cores de texto sobre os dois fundos claros do tema ============ */
secao('texto sobre papel/white — ≥ 4.5:1');

const CORES_DE_TEXTO = ['tinta', 'azul', 'grafite', 'riso-texto', 'ocre-texto'];
const FUNDOS_CLAROS = ['papel', 'white'];

for (const cor of CORES_DE_TEXTO) {
  for (const fundo of FUNDOS_CLAROS) {
    const razao = razaoDeContraste(TOKENS[cor], TOKENS[fundo]);
    conferir(
      `${cor} sobre ${fundo}`,
      razao >= MINIMO_TEXTO,
      true,
    );
  }
}

/* ============ 2. Regressão: riso/ocre puros continuam abaixo do mínimo como texto ============ */
secao('riso/ocre puros continuam reprovando como texto (por isso existem as versões -texto)');
conferir('riso sobre papel < 4.5 (por isso riso-texto existe)', razaoDeContraste(TOKENS.riso, TOKENS.papel) < MINIMO_TEXTO, true);
conferir('ocre sobre papel < 4.5 (por isso ocre-texto existe)', razaoDeContraste(TOKENS.ocre, TOKENS.papel) < MINIMO_TEXTO, true);

/* ============ 3. Preenchimento (bg-riso/bg-ocre) com texto tinta por cima ============ */
secao('tinta sobre riso/ocre (selo, badge) — ≥ 4.5:1');
conferir('tinta sobre riso', razaoDeContraste(TOKENS.tinta, TOKENS.riso) >= MINIMO_TEXTO, true);
conferir('tinta sobre ocre', razaoDeContraste(TOKENS.tinta, TOKENS.ocre) >= MINIMO_TEXTO, true);

/* ============ 4. As duas cores novas realmente batem o mínimo pedido ============ */
secao('riso-texto / ocre-texto — razões exatas (reportadas na Tarefa 1)');
const razaoRisoTextoPapel = razaoDeContraste(TOKENS['riso-texto'], TOKENS.papel);
const razaoRisoTextoWhite = razaoDeContraste(TOKENS['riso-texto'], TOKENS.white);
const razaoOcreTextoPapel = razaoDeContraste(TOKENS['ocre-texto'], TOKENS.papel);
const razaoOcreTextoWhite = razaoDeContraste(TOKENS['ocre-texto'], TOKENS.white);

caso(`riso-texto sobre papel = ${razaoRisoTextoPapel.toFixed(2)}:1 (≥ 4.5)`, razaoRisoTextoPapel >= MINIMO_TEXTO);
caso(`riso-texto sobre white = ${razaoRisoTextoWhite.toFixed(2)}:1 (≥ 4.5)`, razaoRisoTextoWhite >= MINIMO_TEXTO);
caso(`ocre-texto sobre papel = ${razaoOcreTextoPapel.toFixed(2)}:1 (≥ 4.5)`, razaoOcreTextoPapel >= MINIMO_TEXTO);
caso(`ocre-texto sobre white = ${razaoOcreTextoWhite.toFixed(2)}:1 (≥ 4.5)`, razaoOcreTextoWhite >= MINIMO_TEXTO);

/* ============ 5. Guarda estrutural: nenhum text-riso/text-ocre puro sobrou no código ============ */
secao('nenhum text-riso/text-ocre puro em src/ (guarda de regressão)');

/** Varre `src/**\/*.tsx` recursivamente — sem depender de nenhuma lib de glob. */
function listarArquivosTsx(dir) {
  const arquivos = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) arquivos.push(...listarArquivosTsx(caminho));
    else if (nome.endsWith('.tsx')) arquivos.push(caminho);
  }
  return arquivos;
}

const PADRAO_TEXTO_PURO = /text-(riso|ocre)(?!-texto)(?=["'\s])/;
const arquivosComTextoPuro = listarArquivosTsx(join(RAIZ, 'src'))
  .filter((caminho) => PADRAO_TEXTO_PURO.test(readFileSync(caminho, 'utf8')));

conferir('nenhum arquivo usa text-riso/text-ocre sem -texto', arquivosComTextoPuro, []);

encerrar();
