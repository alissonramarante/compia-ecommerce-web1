import { carregarModulo, criarPlacar } from './arnes.mjs';

const d = await carregarModulo('src/lib/demonstracao.ts', 'demonstracao');

const { conferir, secao, encerrar } = criarPlacar();

/** Dublê com `length` e `key`, que é como a varredura descobre as chaves. */
function armazenamentoFalso(inicial = {}) {
  const dados = { ...inicial };

  return {
    dados,
    get length() {
      return Object.keys(dados).length;
    },
    key: (indice) => Object.keys(dados)[indice] ?? null,
    getItem: (chave) => (chave in dados ? dados[chave] : null),
    setItem: (chave, valor) => {
      dados[chave] = String(valor);
    },
    removeItem: (chave) => {
      delete dados[chave];
    },
  };
}

const AMOSTRA = {
  'compia:carrinho:v1:cli-001': '[]',
  'compia:carrinho:v1:cli-002': '[]',
  'compia:sessao:v1': '{}',
  'compia:pedidos:v1': '[]',
  'outra-app:tema': 'escuro',
  'analytics_id': 'xyz',
};

/* ============ 1. varredura ============ */
secao('chavesDaDemonstracao');
delete globalThis.localStorage;
conferir('sem localStorage', d.chavesDaDemonstracao(), []);

globalThis.localStorage = armazenamentoFalso();
conferir('armazenamento vazio', d.chavesDaDemonstracao(), []);

globalThis.localStorage = armazenamentoFalso(AMOSTRA);
conferir('acha as 4 nossas', d.chavesDaDemonstracao().sort(), [
  'compia:carrinho:v1:cli-001',
  'compia:carrinho:v1:cli-002',
  'compia:pedidos:v1',
  'compia:sessao:v1',
]);
conferir('ignora chave de terceiro', d.chavesDaDemonstracao().includes('outra-app:tema'), false);

/* A varredura é por prefixo com os dois-pontos: 'compia' sozinho não é nosso. */
globalThis.localStorage = armazenamentoFalso({ compia: 'x', 'compiabolada': 'y', 'compia:algo': 'z' });
conferir('exige o prefixo completo', d.chavesDaDemonstracao(), ['compia:algo']);

/* O ponto da varredura: chave que ainda não existe hoje também é apagada. */
globalThis.localStorage = armazenamentoFalso({ ...AMOSTRA, 'compia:produtos:v1': '[]', 'compia:logs:v1': '[]' });
conferir('pega chave futura da Fatia 7', d.chavesDaDemonstracao().length, 6);

globalThis.localStorage = { get length() { throw new Error('bloqueado'); } };
conferir('armazenamento que lanca', d.chavesDaDemonstracao(), []);

/* ============ 2. remoção ============ */
secao('restaurarDemonstracao');
globalThis.localStorage = armazenamentoFalso(AMOSTRA);
conferir('devolve quantas removeu', d.restaurarDemonstracao(), 4);
conferir('nossas chaves sumiram', d.chavesDaDemonstracao(), []);
conferir('as de terceiros sobrevivem', Object.keys(globalThis.localStorage.dados).sort(), ['analytics_id', 'outra-app:tema']);

globalThis.localStorage = armazenamentoFalso();
conferir('armazenamento vazio devolve 0', d.restaurarDemonstracao(), 0);

globalThis.localStorage = armazenamentoFalso({ ...AMOSTRA, 'compia:produtos:v1': '[]' });
conferir('remove tambem a chave futura', d.restaurarDemonstracao(), 5);

/* Idempotência: rodar de novo não quebra nem conta o que já foi. */
globalThis.localStorage = armazenamentoFalso(AMOSTRA);
d.restaurarDemonstracao();
conferir('segunda passada devolve 0', d.restaurarDemonstracao(), 0);

globalThis.localStorage = {
  length: 1,
  key: () => 'compia:sessao:v1',
  removeItem: () => { throw new Error('modo privado'); },
};
conferir('removeItem que lanca nao propaga', (() => { try { return d.restaurarDemonstracao(); } catch { return 'LANCOU'; } })(), 0);

delete globalThis.localStorage;
conferir('sem localStorage devolve 0', d.restaurarDemonstracao(), 0);

conferir('prefixo exportado', d.PREFIXO_DAS_CHAVES, 'compia:');

encerrar();
