import { carregarArnes } from './arnes.mjs';
const { renderizarComProvedores } = await carregarArnes();

function comSessao(sessao) {
  return renderizarComProvedores('/entrar', { comLayout: true, sessao });
}

let falhas = 0;
const caso = (nome, ok) => {
  if (!ok) falhas++;
  console.log((ok ? 'ok    ' : 'FALHA ') + nome);
};

/* --- padrão: cli-001, sem equipe --- */
const padrao = comSessao(null);
caso('duas seções com h2', (padrao.match(/<h2/g) || []).length >= 2);
caso('seção de cliente', padrao.includes('Entrar como cliente'));
caso('seção da equipe', padrao.includes('Acesso da equipe'));
caso('diz que é demonstração, não autenticação', padrao.includes('Seletor de demonstração') && padrao.includes('não tem autenticação'));
caso('lista os três clientes', padrao.includes('Yasmim Oliveira') && padrao.includes('Eduardo Sampaio') && padrao.includes('Larissa Fontes'));
caso('mostra a cidade de cada um', padrao.includes('Campina Grande, PB') && padrao.includes('São Paulo, SP') && padrao.includes('Salvador, BA'));
caso('cliente padrão vem marcado', /id="cliente-cli-001"[^>]*checked|checked[^>]*id="cliente-cli-001"/.test(padrao));
caso('os outros não vêm marcados', !/id="cliente-cli-002"[^>]*checked/.test(padrao));
caso('cada radio tem label associado', padrao.includes('for="cliente-cli-002"'));
caso('campo de e-mail com label', padrao.includes('for="email-da-equipe"') && padrao.includes('id="email-da-equipe"'));
caso('erro da equipe tem aria-live', padrao.includes('aria-live="polite"'));
caso('sem senha na tela', !padrao.toLowerCase().includes('senha</label>') && !padrao.includes('type="password"'));
caso('cabeçalho mostra o primeiro nome', padrao.includes('Yasmim<'));
caso('conta tem aria-label com nome completo', padrao.includes('aria-label="Conta de Yasmim Oliveira"'));
caso('conta tem ícone de pessoa', /aria-label="Conta de [^"]+"[^>]*>[^<]*<svg/.test(padrao));
caso('cabeçalho não diz mais "Conta"', !padrao.includes('>Conta</a>'));
caso('não mostra painel sem equipe logada', !padrao.includes('Ir para o painel'));

/* --- outro cliente salvo --- */
const outro = comSessao({ clienteId: 'cli-003', usuarioId: null });
caso('cliente salvo vem marcado', /id="cliente-cli-003"[^>]*checked/.test(outro));
caso('cabeçalho acompanha o cliente salvo', outro.includes('Larissa<'));
caso('aria-label acompanha o cliente', outro.includes('aria-label="Conta de Larissa Fontes"'));
caso('rodapé da seção diz quem está comprando', outro.includes('Agora comprando como Larissa Fontes.'));

/* --- equipe logada --- */
const comEquipe = comSessao({ clienteId: 'cli-001', usuarioId: 'usr-001' });
caso('mostra o nome de quem entrou', comEquipe.includes('Renata Coutinho'));
caso('mostra o perfil', comEquipe.includes('admin'));
caso('oferece o painel', comEquipe.includes('href="/admin"') && comEquipe.includes('Ir para o painel'));
caso('oferece sair', comEquipe.includes('Sair do acesso da equipe'));
caso('esconde o formulário de e-mail', !comEquipe.includes('id="email-da-equipe"'));

/* --- usuário inativo salvo não restaura --- */
const inativo = comSessao({ clienteId: 'cli-001', usuarioId: 'usr-004' });
caso('inativo não é restaurado', !inativo.includes('Otávio Lemos'));
caso('inativo volta ao formulário', inativo.includes('id="email-da-equipe"'));

/* --- sessão corrompida --- */
const corrompida = renderizarComProvedores('/entrar', {
  comLayout: true,
  bruto: { 'compia:sessao:v1': '{{{' },
});
caso('sessão corrompida cai no padrão sem quebrar', corrompida.includes('Yasmim<'));

delete globalThis.localStorage;
console.log('\n' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
