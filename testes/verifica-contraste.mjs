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
 * visual: `riso` só vale como `bg-riso` com `text-tinta` por cima, nunca como
 * texto — não existe `riso-texto`, de propósito, para não afrouxar a regra.
 * `ocre` tem a mesma restrição, mas com uma saída: `ocre-texto` é a versão
 * escurecida para `text-*` direto sobre fundo claro, porque estoque baixo e
 * erro de campo precisam escrever nessa cor, não só preencher um selo.
 */

const MINIMO_TEXTO = 4.5;

/* ============ 1. Cores de texto sobre os dois fundos claros do tema ============ */
secao('texto sobre papel/white — ≥ 4.5:1');

const CORES_DE_TEXTO = ['tinta', 'azul', 'grafite', 'ocre-texto'];
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
secao('riso/ocre puros continuam reprovando como texto');
conferir('riso sobre papel < 4.5 (por isso riso nunca vira texto, só bg-riso)', razaoDeContraste(TOKENS.riso, TOKENS.papel) < MINIMO_TEXTO, true);
conferir('ocre sobre papel < 4.5 (por isso ocre-texto existe)', razaoDeContraste(TOKENS.ocre, TOKENS.papel) < MINIMO_TEXTO, true);

/* ============ 3. Preenchimento (bg-riso/bg-ocre) com texto tinta por cima ============ */
secao('tinta sobre riso/ocre (selo, badge) — ≥ 4.5:1');
conferir('tinta sobre riso', razaoDeContraste(TOKENS.tinta, TOKENS.riso) >= MINIMO_TEXTO, true);
conferir('tinta sobre ocre', razaoDeContraste(TOKENS.tinta, TOKENS.ocre) >= MINIMO_TEXTO, true);

/* ============ 4. ocre-texto realmente bate o mínimo pedido ============ */
secao('ocre-texto — razões exatas (reportadas na Tarefa 1)');
const razaoOcreTextoPapel = razaoDeContraste(TOKENS['ocre-texto'], TOKENS.papel);
const razaoOcreTextoWhite = razaoDeContraste(TOKENS['ocre-texto'], TOKENS.white);

caso(`ocre-texto sobre papel = ${razaoOcreTextoPapel.toFixed(2)}:1 (≥ 4.5)`, razaoOcreTextoPapel >= MINIMO_TEXTO);
caso(`ocre-texto sobre white = ${razaoOcreTextoWhite.toFixed(2)}:1 (≥ 4.5)`, razaoOcreTextoWhite >= MINIMO_TEXTO);

/* ============ 5. Guarda estrutural: nenhum text-riso e nenhum text-ocre puro sobrou no código ============ */
secao('nenhum text-riso (em nenhuma forma) nem text-ocre puro em src/ (guarda de regressão)');

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

/* `riso` não tem versão de texto: qualquer `text-riso`, inclusive um
   hipotético `text-riso-texto` digitado por engano, é erro. `ocre` só barra
   a forma pura — `ocre-texto` é a saída válida. */
const PADRAO_RISO_COMO_TEXTO = /text-riso(?![a-zA-Z])/;
const PADRAO_OCRE_PURO_COMO_TEXTO = /text-ocre(?!-texto)(?![a-zA-Z])/;

const arquivosTsx = listarArquivosTsx(join(RAIZ, 'src'));
const arquivosComRisoDeTexto = arquivosTsx.filter((caminho) => PADRAO_RISO_COMO_TEXTO.test(readFileSync(caminho, 'utf8')));
const arquivosComOcreTextoPuro = arquivosTsx.filter((caminho) => PADRAO_OCRE_PURO_COMO_TEXTO.test(readFileSync(caminho, 'utf8')));

conferir('nenhum arquivo usa text-riso em qualquer forma', arquivosComRisoDeTexto, []);
conferir('nenhum arquivo usa text-ocre sem -texto', arquivosComOcreTextoPuro, []);

encerrar();
