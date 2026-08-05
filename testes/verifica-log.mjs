import { carregarModulo, criarPlacar } from './arnes.mjs';

const lib = await carregarModulo('src/lib/log.ts', 'log');
const arm = await carregarModulo('src/lib/logsArmazenados.ts', 'logsArmazenados');
const ctx = await carregarModulo('src/contexts/LogsContext.tsx', 'logsContext');
const { logs } = await carregarModulo('src/mocks/index.ts', 'logsMock');

const { conferir, secao, encerrar } = criarPlacar();

/* ============ 1. ROTULO_DE_ACAO ============ */
secao('ROTULO_DE_ACAO');
const ACOES = ['login', 'logout', 'produto_criado', 'produto_editado', 'produto_excluido', 'pedido_status_alterado', 'email_enviado'];
conferir('cobre as sete acoes de AcaoLog', ACOES.every((acao) => typeof lib.ROTULO_DE_ACAO[acao] === 'string'), true);
conferir('login', lib.ROTULO_DE_ACAO.login, 'Login');
conferir('produto_excluido', lib.ROTULO_DE_ACAO.produto_excluido, 'Produto excluído');

/* ============ 2. maiorNumeroDeLog ============ */
secao('maiorNumeroDeLog');
conferir('a partir dos 3 mocks', lib.maiorNumeroDeLog(logs), 3);
conferir('lista vazia', lib.maiorNumeroDeLog([]), 0);
conferir('pega o maior, nao o ultimo', lib.maiorNumeroDeLog([{ id: 'log-005' }, { id: 'log-002' }]), 5);
conferir('id malformado e ignorado', lib.maiorNumeroDeLog([{ id: 'log-abc' }, { id: 'log-003' }]), 3);
conferir('nao muta a lista recebida', logs.length, 3);

/* ============ 4. filtrarLogs ============ */
secao('filtrarLogs');
const semFiltro = { acao: '', usuarioId: '' };
conferir('sem filtro: os 3, mais recente primeiro', lib.filtrarLogs(logs, semFiltro).map((l) => l.id), ['log-003', 'log-002', 'log-001']);
conferir('filtro por acao', lib.filtrarLogs(logs, { ...semFiltro, acao: 'login' }).map((l) => l.id), ['log-003']);
conferir('filtro por usuario', lib.filtrarLogs(logs, { ...semFiltro, usuarioId: 'usr-002' }).map((l) => l.id), ['log-001']);
conferir('acao + usuario combinados, sem interseccao', lib.filtrarLogs(logs, { acao: 'login', usuarioId: 'usr-002' }), []);
conferir('acao + usuario combinados, com interseccao', lib.filtrarLogs(logs, { acao: 'login', usuarioId: 'usr-001' }).map((l) => l.id), ['log-003']);
conferir('nao muta a lista recebida', logs.length, 3);

/* ============ 5. logsArmazenados ============ */
secao('logsArmazenados');
conferir('chave versionada', arm.CHAVE_LOGS, 'compia:logs:v1');
conferir('ida e volta preserva os 3', arm.desserializar(arm.serializar(logs)).length, 3);
conferir('JSON corrompido nao lanca', arm.desserializar('{{{'), []);
conferir('string vazia', arm.desserializar(''), []);
conferir('objeto no lugar de array', arm.desserializar('{}'), []);
conferir('sem usuarioId e descartado', arm.desserializar(JSON.stringify([{ ...logs[0], usuarioId: '' }])), []);
conferir('acao inventada e descartada', arm.desserializar(JSON.stringify([{ ...logs[0], acao: 'xpto' }])), []);
conferir('sem entidadeId e mantido (campo opcional)', arm.desserializar(JSON.stringify([{ ...logs[0], entidadeId: undefined }])).length, 1);
conferir('array misto guarda so o valido', arm.desserializar(JSON.stringify([null, logs[0], 'lixo'])).length, 1);

function armazenamentoFalso(inicial = {}) {
  const dados = { ...inicial };
  return { dados, getItem: (k) => (k in dados ? dados[k] : null), setItem: (k, v) => { dados[k] = String(v); }, removeItem: (k) => { delete dados[k]; } };
}

delete globalThis.localStorage;
conferir('sem localStorage: carregar da null', arm.carregar(), null);
conferir('sem localStorage: salvar nao lanca', (() => { try { arm.salvar(logs); return 'nao lancou'; } catch { return 'LANCOU'; } })(), 'nao lancou');
conferir('sem localStorage: semeia com os mocks', arm.carregarLogs(logs).length, 3);

globalThis.localStorage = armazenamentoFalso();
conferir('nada gravado: semeia com os mocks', arm.carregarLogs(logs).length, 3);
arm.salvar([logs[0]]);
conferir('gravado manda sobre a semente', arm.carregarLogs(logs).length, 1);
globalThis.localStorage = armazenamentoFalso({ 'compia:logs:v1': '[]' });
conferir('gravado vazio e respeitado', arm.carregarLogs(logs), []);
globalThis.localStorage = armazenamentoFalso({ 'compia:logs:v1': '{{{' });
conferir('gravado corrompido nao derruba', arm.carregarLogs(logs), []);
globalThis.localStorage = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('modo privado'); } };
conferir('getItem que lanca: cai na semente', arm.carregarLogs(logs).length, 3);
conferir('setItem que lanca nao propaga', (() => { try { arm.salvar(logs); return 'nao lancou'; } catch { return 'LANCOU'; } })(), 'nao lancou');
delete globalThis.localStorage;

/* ============ 6. reducerLogs ============ */
secao('reducerLogs');
const AGORA = '2026-08-06T09:00:00Z';
const dadosDeLogout = { usuarioId: 'usr-001', acao: 'logout', entidade: 'usuario', entidadeId: 'usr-001', descricao: 'Saiu' };

const estadoInicial = { logs: [logs[0], logs[1]], proximoNumero: 3 };
const acrescido = ctx.reducerLogs(estadoInicial, { tipo: 'adicionar', dados: dadosDeLogout, em: AGORA });
conferir('adicionar aumenta a lista', acrescido.logs.length, 3);
conferir('id vem do contador em estado, nao de reler a lista', acrescido.logs[2].id, 'log-003');
conferir('proximoNumero avanca', acrescido.proximoNumero, 4);
conferir('campos do registro montados corretamente', acrescido.logs[2], {
  id: 'log-003',
  usuarioId: dadosDeLogout.usuarioId,
  acao: dadosDeLogout.acao,
  entidade: dadosDeLogout.entidade,
  entidadeId: dadosDeLogout.entidadeId,
  descricao: dadosDeLogout.descricao,
  em: AGORA,
});
conferir('nao muta o estado anterior', estadoInicial.logs.length, 2);

const semEntidadeId = ctx.reducerLogs(estadoInicial, {
  tipo: 'adicionar',
  dados: { usuarioId: 'usr-002', acao: 'logout', entidade: 'usuario', descricao: 'Saiu' },
  em: AGORA,
});
conferir('sem entidadeId: chave ausente no registro, nao string vazia', 'entidadeId' in semEntidadeId.logs[2], false);

/* O ponto da Tarefa 4 (correção): dois logs despachados em sequência — como
   a mudança de status e o e-mail de confirmação em PedidoDetalhe — usam o
   contador em estado, não a lista relida (que só atualiza no próximo
   render). Simula exatamente o que useReducer faz: cada despacho opera
   sobre o estado já atualizado pelo anterior, nunca sobre o closure velho. */
secao('dois logs no mesmo manipulador de evento (a correção pedida)');
const estadoComTres = { logs: [logs[0], logs[1], logs[2]], proximoNumero: 4 };
const dadosDeStatus = { usuarioId: 'usr-001', acao: 'pedido_status_alterado', entidade: 'pedido', entidadeId: 'ped-002', descricao: 'em_separacao -> enviado' };
const dadosDeEmail = { usuarioId: 'usr-001', acao: 'email_enviado', entidade: 'pedido', entidadeId: 'ped-002', descricao: 'E-mail enviado' };

const aposPrimeiro = ctx.reducerLogs(estadoComTres, { tipo: 'adicionar', dados: dadosDeStatus, em: AGORA });
const aposSegundo = ctx.reducerLogs(aposPrimeiro, { tipo: 'adicionar', dados: dadosDeEmail, em: AGORA });

conferir('os dois foram gravados', aposSegundo.logs.length, 5);
conferir('ids distintos', aposPrimeiro.logs[3].id !== aposSegundo.logs[4].id, true);
conferir('ids sequenciais, sem pular nem repetir', [aposPrimeiro.logs[3].id, aposSegundo.logs[4].id], ['log-004', 'log-005']);
conferir('cada acao gravada corretamente', [aposSegundo.logs[3].acao, aposSegundo.logs[4].acao], ['pedido_status_alterado', 'email_enviado']);

/* ============ 7. criarEstadoInicial ============ */
secao('criarEstadoInicial');
globalThis.localStorage = armazenamentoFalso();
conferir('sem nada gravado: os 3 mocks', ctx.criarEstadoInicial().logs.length, 3);
globalThis.localStorage = armazenamentoFalso({ 'compia:logs:v1': JSON.stringify([logs[1]]) });
conferir('gravado manda', ctx.criarEstadoInicial().logs.map((x) => x.id), ['log-002']);
globalThis.localStorage = armazenamentoFalso({ 'compia:logs:v1': 'nao e json' });
conferir('corrompido nao derruba', ctx.criarEstadoInicial().logs, []);
delete globalThis.localStorage;

encerrar();
