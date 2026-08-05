import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Roda as suítes em sequência e sai com código diferente de zero se
 * qualquer uma falhar. Serve de porta, não de relatório: é isso que
 * permite plugar em hook ou CI depois.
 *
 * Sequência, e não paralelo, de propósito: as suítes trocam
 * `globalThis.localStorage` por um dublê, e isso é estado global do
 * processo — se bem que cada uma roda em processo próprio, manter a ordem
 * deixa a saída legível.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));

const SUITES = [
  ['catalogo', 'verifica-catalogo.mjs', 'lib/catalogo: filtro, ordenação, URL'],
  ['debounce', 'verifica-debounce.mjs', 'lib/campoDebounced: histórico'],
  ['produto', 'verifica-produto.mjs', 'lib/produto: kit, relacionados, ficha'],
  ['produtos', 'verifica-produtos.mjs', 'lib/produto (estoque) + produtosArmazenados + reducer'],
  ['carrinho', 'verifica-carrinho.mjs', 'lib/carrinho + persistência + reducer'],
  ['sessao', 'verifica-sessao.mjs', 'lib/sessao + persistência + reducer'],
  ['frete', 'verifica-frete.mjs', 'lib/frete: CEP, faixas, gratuidade'],
  ['pagamento', 'verifica-pagamento.mjs', 'lib/pagamento: Luhn, bandeira, PIX'],
  ['pedido', 'verifica-pedido.mjs', 'lib/pedido + persistência + reducer'],
  ['demonstracao', 'verifica-demonstracao.mjs', 'lib/demonstracao: varredura e reset'],
  ['conta', 'verifica-conta.mjs', 'lib/conta: abas, downloads, recompra'],
  ['checkout', 'verifica-checkout.mjs', 'lib/checkout: passos, validação, PIX vencido'],
  ['catalogo (tela)', 'verifica-render.mjs', 'renderização do catálogo'],
  ['produto (tela)', 'verifica-produto-render.mjs', 'renderização do produto'],
  ['carrinho (tela)', 'verifica-carrinho-render.mjs', 'renderização do carrinho'],
  ['entrar (tela)', 'verifica-entrar-render.mjs', 'renderização da tela de entrar'],
  ['conta (tela)', 'verifica-conta-render.mjs', 'renderização das três abas da conta'],
  ['checkout (tela)', 'verifica-checkout-render.mjs', 'renderização do checkout e do pedido'],
];

const detalhado = process.argv.includes('--detalhado');

let falharam = 0;
let asserçoes = 0;

for (const [nome, arquivo, descricao] of SUITES) {
  const inicio = process.hrtime.bigint();
  const resultado = spawnSync(process.execPath, [join(AQUI, arquivo)], {
    encoding: 'utf8',
    stdio: detalhado ? 'inherit' : 'pipe',
  });
  const ms = Number((process.hrtime.bigint() - inicio) / 1000000n);

  const saida = resultado.stdout ?? '';
  const ok = resultado.status === 0;
  const contagem = (saida.match(/^ok /gm) ?? []).length;
  asserçoes += contagem;

  if (!ok) {
    falharam += 1;
    if (!detalhado) {
      process.stdout.write(saida);
      process.stderr.write(resultado.stderr ?? '');
    }
  }

  console.log(
    `${ok ? 'ok  ' : 'FALHA'}  ${nome.padEnd(17)} ${String(contagem).padStart(3)} asserções  ${String(ms).padStart(5)} ms  ${descricao}`,
  );
}

console.log('');
console.log(
  falharam === 0
    ? `${SUITES.length} suítes, ${asserçoes} asserções, tudo passou.`
    : `${falharam} de ${SUITES.length} suítes falharam.`,
);

process.exit(falharam === 0 ? 0 : 1);
