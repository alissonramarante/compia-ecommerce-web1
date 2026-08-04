import { carregarArnes, carregarModulo, criarPlacar } from './arnes.mjs';

const { renderizarComProvedores } = await carregarArnes();
const { pedidos } = await carregarModulo('src/mocks/pedidos.ts', 'pedidosMock');

const { caso, secao, encerrar } = criarPlacar();

const conta = (busca, opcoes = {}) =>
  renderizarComProvedores(`/conta${busca}`, { comLayout: true, ...opcoes });

const ped = (numero) => pedidos.find((p) => p.numero === numero);

/* ============ 1. abas ============ */
secao('abas');
const padrao = conta('');
caso('sem parametro abre pedidos', padrao.includes('id="titulo-pedidos"'));
caso('as tres abas aparecem', padrao.includes('>Pedidos<') && padrao.includes('>Downloads<') && padrao.includes('>Meus dados<'));
caso('navegacao rotulada', padrao.includes('aria-label="Seções da conta"'));
/* Sem depender da ordem dos atributos: React emite aria-current antes de
   href, e o teste não pode presumir isso. */
const ancoraDaAba = (html, aba) =>
  (html.match(/<a[^>]*>/g) ?? []).find((tag) => tag.includes(`/conta?aba=${aba}`)) ?? '';
caso('aba ativa marcada com aria-current', ancoraDaAba(padrao, 'pedidos').includes('aria-current="page"'));
caso('abas inativas nao sao marcadas', !ancoraDaAba(padrao, 'dados').includes('aria-current'));
caso('marcacao acompanha a aba', ancoraDaAba(conta('?aba=dados'), 'dados').includes('aria-current="page"'));
caso('abas sao links de verdade', padrao.includes('href="/conta?aba=downloads"'));
caso('titulo e o nome do cliente', padrao.includes('Yasmim Oliveira'));

caso('?aba=downloads abre downloads', conta('?aba=downloads').includes('id="titulo-downloads"'));
caso('?aba=dados abre dados', conta('?aba=dados').includes('id="titulo-dados"'));
caso('?aba=xpto cai em pedidos', conta('?aba=xpto').includes('id="titulo-pedidos"'));
caso('?aba= vazio cai em pedidos', conta('?aba=').includes('id="titulo-pedidos"'));
caso('so uma aba renderiza por vez', !conta('?aba=dados').includes('id="titulo-pedidos"'));

/* ============ 2. aba pedidos ============ */
secao('pedidos');
caso('lista o pedido do cli-001', padrao.includes('CPA-2026-0139'));
caso('e o outro tambem', padrao.includes('CPA-2026-0142'));
caso('nao lista pedido de outro cliente', !padrao.includes('CPA-2026-0140'));
caso('status legivel', padrao.includes('Entregue') && padrao.includes('Cancelado'));
caso('cancelado em grafite, sem riso', /text-grafite[^"]*"[^>]*>Cancelado</.test(padrao) || padrao.includes('text-grafite'));
caso('nao usa riso no status', !/text-riso[^"]*"[^>]*>(Entregue|Cancelado|Aguardando)/.test(padrao));
caso('data do pedido', padrao.includes('19/02/2026'));
caso('total em mono', padrao.includes('R$ 69,00'));
caso('link para o pedido', padrao.includes('href="/pedido/CPA-2026-0139"'));
caso('botao comprar de novo', padrao.includes('Comprar de novo'));
caso('regiao aria-live para o aviso', padrao.includes('aria-live="polite"'));

/* PIX em aberto: cli-003 tem ped-003, mas está vencido nos mocks. */
const vencidoPix = conta('', { sessao: { clienteId: 'cli-003', usuarioId: null } });
caso('PIX expirado e rotulado como tal', vencidoPix.includes('A cobrança PIX expirou'));
caso('sem falsa urgencia no expirado', !vencidoPix.includes('Vence em'));
caso('oferece gerar outra', vencidoPix.includes('Gerar outra'));

const futuro = new Date(Date.now() + 18 * 60 * 1000).toISOString();
const pixAberto = conta('', {
  sessao: { clienteId: 'cli-003', usuarioId: null },
  pedidos: [{ ...ped('CPA-2026-0141'), pagamento: { ...ped('CPA-2026-0141').pagamento, expiraEm: futuro } }],
});
caso('PIX em aberto ganha destaque', pixAberto.includes('PIX aguardando pagamento'));
caso('mostra o tempo restante', /Vence em <span[^>]*>1[0-9] min</.test(pixAberto));
caso('oferece pagar agora', pixAberto.includes('Pagar agora'));
caso('em aberto nao diz expirou', !pixAberto.includes('A cobrança PIX expirou'));

/* Estado vazio: nenhum cliente do mock está sem pedido, então semeia vazio. */
const semPedidos = conta('', { pedidos: [] });
caso('estado vazio', semPedidos.includes('Você ainda não fez pedidos.'));
caso('estado vazio convida', semPedidos.includes('Ver catálogo'));
caso('estado vazio nao mostra lista', !semPedidos.includes('Comprar de novo'));

/* ============ 3. aba downloads ============ */
secao('downloads');
const dl = conta('?aba=downloads');
caso('agrupa por titulo', dl.includes('Segurança de Modelos de Linguagem'));
caso('lista os formatos', dl.includes('>pdf<') && dl.includes('>epub<'));
caso('mostra a cota', dl.includes('5 downloads restantes'));
caso('mostra o numero do pedido da cota', dl.includes('CPA-2026-0139'));
caso('diz que os links sao ficticios', dl.includes('links são fictícios'));

const cotaZerada = conta('?aba=downloads', {
  pedidos: [{ ...ped('CPA-2026-0139'), downloads: ped('CPA-2026-0139').downloads.map((d) => ({ ...d, downloadsRestantes: 0 })) }],
});
caso('cota zerada nao vira link', !/<a[^>]*>pdf<\/a>/.test(cotaZerada));
caso('cota zerada continua visivel', cotaZerada.includes('>pdf<'));
caso('cota zerada explica', cotaZerada.includes('Limite de downloads atingido'));

const duasCotas = conta('?aba=downloads', {
  pedidos: [
    ped('CPA-2026-0139'),
    { ...ped('CPA-2026-0139'), id: 'ped-005', numero: 'CPA-2026-0144', downloads: ped('CPA-2026-0139').downloads.map((d) => ({ ...d, downloadsRestantes: 2 })) },
  ],
});
caso('duas compras: um grupo so', (duasCotas.match(/Segurança de Modelos de Linguagem/g) ?? []).length === 1);
caso('duas compras: quatro cotas', (duasCotas.match(/downloads restantes/g) ?? []).length === 4);
caso('explica as cotas independentes', duasCotas.includes('Cada compra tem sua própria cota'));
caso('cotas nao sao somadas', duasCotas.includes('5 downloads restantes') && duasCotas.includes('2 downloads restantes'));

/* Vazio distingue "nunca comprou" de "comprou, mas nada digital". */
const semNada = conta('?aba=downloads', { pedidos: [] });
caso('quem nunca comprou ve uma frase', semNada.includes('Você ainda não comprou e-books.'));
const soFisico = conta('?aba=downloads', { sessao: { clienteId: 'cli-002', usuarioId: null } });
caso('quem comprou so fisico ve outra', soFisico.includes('Nenhum e-book nos seus pedidos.'));
caso('e a explicacao e diferente', soFisico.includes('livros físicos ou kits'));
caso('as duas frases nao se confundem', !soFisico.includes('Você ainda não comprou e-books.'));

/* Pedido cancelado com downloads não libera nada. */
const canceladoComArquivo = conta('?aba=downloads', {
  pedidos: [{ ...ped('CPA-2026-0139'), status: 'cancelado' }],
});
caso('cancelado nao libera download', !canceladoComArquivo.includes('downloads restantes'));

/* ============ 4. aba dados ============ */
secao('dados');
const dados = conta('?aba=dados');
caso('nome', dados.includes('Yasmim Oliveira'));
caso('e-mail', dados.includes('yasmim@exemplo.com'));
caso('telefone', dados.includes('(83) 99812-3344'));
caso('CPF mascarado por padrao', dados.includes('***.456.789-**'));
caso('CPF completo NAO aparece', !dados.includes('123.456.789-00'));
caso('botao mostrar', dados.includes('>mostrar<'));
caso('botao tem aria-pressed', dados.includes('aria-pressed="false"'));
caso('endereco em bloco', dados.includes('Rua Aprígio Veloso'));
caso('principal marcado', dados.includes('>principal<'));
caso('diz que e somente leitura', dados.includes('Somente leitura'));
caso('sem campo editavel de endereco', !dados.includes('id="endereco-cep"'));
caso('sem acesso da equipe deslogado', !dados.includes('Acesso da equipe'));

const comEquipe = conta('?aba=dados', { sessao: { clienteId: 'cli-001', usuarioId: 'usr-001' } });
caso('com equipe logada mostra a secao', comEquipe.includes('Acesso da equipe'));
caso('mostra nome e perfil', comEquipe.includes('Renata Coutinho') && comEquipe.includes('admin'));
caso('link para o painel', comEquipe.includes('href="/admin"'));

encerrar();
