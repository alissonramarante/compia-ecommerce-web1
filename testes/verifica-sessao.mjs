import { carregarModulo } from './arnes.mjs';

const s = await carregarModulo('src/lib/sessao.ts', 'sessao');
const arm = await carregarModulo('src/lib/sessaoArmazenada.ts', 'sessaoArmazenada');
const ctx = await carregarModulo('src/contexts/SessaoContext.tsx', 'sessaoContext');
const { clientes } = await carregarModulo('src/mocks/clientes.ts', 'clientes');
const { usuarios } = await carregarModulo('src/mocks/usuarios.ts', 'usuarios');
const cli = (id) => clientes.find((x) => x.id === id);

let falhas = 0;
const conferir = (nome, obtido, esperado) => {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log((ok ? 'ok    ' : 'FALHA ') + nome.padEnd(48) + JSON.stringify(obtido) + (ok ? '' : '  esperado ' + JSON.stringify(esperado)));
};
const secao = (t) => console.log('\n--- ' + t + ' ---');

/* ============ 1. consultas ============ */
secao('consultas');
conferir('buscarCliente existente', s.buscarCliente(clientes, 'cli-002')?.nome, 'Eduardo Sampaio');
conferir('buscarCliente inexistente', s.buscarCliente(clientes, 'cli-999'), undefined);
conferir('CLIENTE_PADRAO_ID', s.CLIENTE_PADRAO_ID, 'cli-001');
conferir('enderecoPrincipal cli-001', s.enderecoPrincipal(cli('cli-001'))?.cidade, 'Campina Grande');
conferir('enderecoPrincipal sem endereco', s.enderecoPrincipal({ ...cli('cli-001'), enderecos: [] }), undefined);
conferir('cidadeDoCliente cli-001', s.cidadeDoCliente(cli('cli-001')), 'Campina Grande, PB');
conferir('cidadeDoCliente cli-002', s.cidadeDoCliente(cli('cli-002')), 'S\u00e3o Paulo, SP');
conferir('cidadeDoCliente cli-003', s.cidadeDoCliente(cli('cli-003')), 'Salvador, BA');
conferir('cidadeDoCliente sem endereco', s.cidadeDoCliente({ ...cli('cli-001'), enderecos: [] }), '');
conferir('primeiroNome composto', s.primeiroNome('Yasmim Oliveira'), 'Yasmim');
conferir('primeiroNome com espacos', s.primeiroNome('  Ana  L\u00facia  '), 'Ana');
conferir('primeiroNome simples', s.primeiroNome('Madonna'), 'Madonna');
conferir('primeiroNome vazio', s.primeiroNome(''), '');

/* ============ 2. acesso da equipe ============ */
secao('autenticarEquipe');
conferir('admin entra', s.autenticarEquipe(usuarios, 'renata@compia.com.br').ok, true);
conferir('admin traz o perfil', s.autenticarEquipe(usuarios, 'renata@compia.com.br').usuario?.perfil, 'admin');
conferir('caixa alta e ignorada', s.autenticarEquipe(usuarios, 'RENATA@COMPIA.COM.BR').ok, true);
conferir('espacos sao aparados', s.autenticarEquipe(usuarios, '  gustavo@compia.com.br  ').ok, true);
conferir('editor entra', s.autenticarEquipe(usuarios, 'gustavo@compia.com.br').usuario?.perfil, 'editor');
conferir('vendedor entra', s.autenticarEquipe(usuarios, 'claudia@compia.com.br').usuario?.perfil, 'vendedor');
const inativo = s.autenticarEquipe(usuarios, 'otavio@compia.com.br');
conferir('inativo e recusado', inativo.ok, false);
conferir('inativo tem erro proprio', inativo.erro, 'A conta de Ot\u00e1vio Lemos est\u00e1 inativa. Pe\u00e7a a um administrador para reativ\u00e1-la.');
const ausente = s.autenticarEquipe(usuarios, 'ninguem@compia.com.br');
conferir('email ausente e recusado', ausente.ok, false);
conferir('erro de ausente cita o dominio', ausente.erro.includes('@compia.com.br'), true);
conferir('campo vazio tem erro proprio', s.autenticarEquipe(usuarios, '').erro, 'Digite o e-mail da equipe para entrar.');
conferir('so espacos conta como vazio', s.autenticarEquipe(usuarios, '   ').erro, 'Digite o e-mail da equipe para entrar.');

/* ============ 3. serializacao ============ */
secao('desserializar');
conferir('sessao valida sem usuario', arm.desserializar('{"clienteId":"cli-002","usuarioId":null}'), { clienteId: 'cli-002', usuarioId: null });
conferir('sessao valida com usuario', arm.desserializar('{"clienteId":"cli-002","usuarioId":"usr-001"}'), { clienteId: 'cli-002', usuarioId: 'usr-001' });
conferir('JSON corrompido nao lanca', arm.desserializar('{{{'), null);
conferir('string vazia', arm.desserializar(''), null);
conferir('null', arm.desserializar('null'), null);
conferir('array', arm.desserializar('[]'), null);
conferir('clienteId vazio', arm.desserializar('{"clienteId":"","usuarioId":null}'), null);
conferir('sem usuarioId', arm.desserializar('{"clienteId":"cli-002"}'), null);
conferir('clienteId numerico', arm.desserializar('{"clienteId":1,"usuarioId":null}'), null);
conferir('usuarioId numerico', arm.desserializar('{"clienteId":"c","usuarioId":7}'), null);
conferir('usuarioId string vazia', arm.desserializar('{"clienteId":"c","usuarioId":""}'), null);
conferir('campos extras sao ignorados', arm.desserializar('{"clienteId":"cli-002","usuarioId":null,"xpto":1}'), { clienteId: 'cli-002', usuarioId: null });
conferir('ida e volta', arm.desserializar(arm.serializar({ clienteId: 'cli-003', usuarioId: 'usr-002' })), { clienteId: 'cli-003', usuarioId: 'usr-002' });
conferir('chave versionada', arm.CHAVE_SESSAO, 'compia:sessao:v1');

/* ============ 4. armazenamento hostil ============ */
secao('carregar e salvar');
function armazenamentoFalso(inicial = {}) {
  const dados = { ...inicial };
  return { dados, getItem: (k) => (k in dados ? dados[k] : null), setItem: (k, v) => { dados[k] = String(v); }, removeItem: (k) => { delete dados[k]; } };
}
delete globalThis.localStorage;
conferir('sem localStorage: carregar da null', arm.carregar(), null);
conferir('sem localStorage: salvar nao lanca', (() => { try { arm.salvar({ clienteId: 'cli-001', usuarioId: null }); return 'nao lancou'; } catch { return 'LANCOU'; } })(), 'nao lancou');

globalThis.localStorage = armazenamentoFalso();
arm.salvar({ clienteId: 'cli-003', usuarioId: 'usr-002' });
conferir('grava so os ids', JSON.parse(globalThis.localStorage.dados['compia:sessao:v1']), { clienteId: 'cli-003', usuarioId: 'usr-002' });
conferir('le de volta', arm.carregar(), { clienteId: 'cli-003', usuarioId: 'usr-002' });

globalThis.localStorage = armazenamentoFalso({ 'compia:sessao:v1': 'nao e json' });
conferir('conteudo corrompido da null', arm.carregar(), null);

globalThis.localStorage = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('modo privado'); } };
conferir('getItem que lanca da null', arm.carregar(), null);
conferir('setItem que lanca nao propaga', (() => { try { arm.salvar({ clienteId: 'cli-001', usuarioId: null }); return 'nao lancou'; } catch { return 'LANCOU'; } })(), 'nao lancou');
delete globalThis.localStorage;

/* ============ 5. resolucao ============ */
secao('resolverSessao');
conferir('sessao nula cai no padrao', arm.resolverSessao(null, clientes, usuarios).cliente.id, 'cli-001');
conferir('sessao nula sem usuario', arm.resolverSessao(null, clientes, usuarios).usuario, null);
conferir('cliente salvo e respeitado', arm.resolverSessao({ clienteId: 'cli-002', usuarioId: null }, clientes, usuarios).cliente.id, 'cli-002');
conferir('cliente inexistente cai no padrao', arm.resolverSessao({ clienteId: 'cli-999', usuarioId: null }, clientes, usuarios).cliente.id, 'cli-001');
conferir('usuario ativo e restaurado', arm.resolverSessao({ clienteId: 'cli-001', usuarioId: 'usr-001' }, clientes, usuarios).usuario?.nome, 'Renata Coutinho');
conferir('usuario inexistente vira null', arm.resolverSessao({ clienteId: 'cli-001', usuarioId: 'usr-999' }, clientes, usuarios).usuario, null);
conferir('usuario INATIVO vira null', arm.resolverSessao({ clienteId: 'cli-001', usuarioId: 'usr-004' }, clientes, usuarios).usuario, null);

/* ============ 6. reducer ============ */
secao('reducerSessao');
const base = { clienteCorrente: cli('cli-001'), usuarioCorrente: null };
conferir('entrarComoCliente troca o cliente', ctx.reducerSessao(base, { tipo: 'entrarComoCliente', cliente: cli('cli-003') }).clienteCorrente.id, 'cli-003');
conferir('entrarComoCliente nao mexe no usuario', ctx.reducerSessao(base, { tipo: 'entrarComoCliente', cliente: cli('cli-003') }).usuarioCorrente, null);
const comUsuario = ctx.reducerSessao(base, { tipo: 'entrarComoUsuario', usuario: usuarios[0] });
conferir('entrarComoUsuario define o usuario', comUsuario.usuarioCorrente?.id, 'usr-001');
conferir('entrarComoUsuario nao mexe no cliente', comUsuario.clienteCorrente.id, 'cli-001');
conferir('sairDaEquipe limpa o usuario', ctx.reducerSessao(comUsuario, { tipo: 'sairDaEquipe' }).usuarioCorrente, null);
conferir('sairDaEquipe preserva o cliente', ctx.reducerSessao(comUsuario, { tipo: 'sairDaEquipe' }).clienteCorrente.id, 'cli-001');
conferir('reducer nao muta o estado', (() => { const antes = { ...base }; ctx.reducerSessao(antes, { tipo: 'entrarComoCliente', cliente: cli('cli-002') }); return antes.clienteCorrente.id; })(), 'cli-001');

/* ============ 7. carga inicial ============ */
secao('criarEstadoInicial');
globalThis.localStorage = armazenamentoFalso();
conferir('sem nada salvo: padrao', ctx.criarEstadoInicial().clienteCorrente.id, 'cli-001');
globalThis.localStorage = armazenamentoFalso({ 'compia:sessao:v1': JSON.stringify({ clienteId: 'cli-002', usuarioId: 'usr-003' }) });
const restaurado = ctx.criarEstadoInicial();
conferir('restaura cliente salvo', restaurado.clienteCorrente.id, 'cli-002');
conferir('restaura usuario ativo', restaurado.usuarioCorrente?.perfil, 'vendedor');
globalThis.localStorage = armazenamentoFalso({ 'compia:sessao:v1': JSON.stringify({ clienteId: 'cli-999', usuarioId: 'usr-004' }) });
const degradado = ctx.criarEstadoInicial();
conferir('id ruim + inativo degrada sem quebrar', [degradado.clienteCorrente.id, degradado.usuarioCorrente], ['cli-001', null]);
globalThis.localStorage = armazenamentoFalso({ 'compia:sessao:v1': '{{{' });
conferir('storage corrompido cai no padrao', ctx.criarEstadoInicial().clienteCorrente.id, 'cli-001');
delete globalThis.localStorage;

console.log('\n' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
