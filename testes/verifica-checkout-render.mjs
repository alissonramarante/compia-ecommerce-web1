import { carregarArnes, criarPlacar } from './arnes.mjs';

const { renderizarComProvedores } = await carregarArnes();
const { caso, secao, encerrar } = criarPlacar();

const FISICO = [{ produtoId: 'prod-001', quantidade: 1, precoUnitario: 15900 }];
const EBOOK = [{ produtoId: 'prod-005', quantidade: 1, precoUnitario: 6900 }];

const checkout = (busca, itens = FISICO) =>
  renderizarComProvedores(`/checkout${busca}`, {
    comLayout: true,
    carrinhos: { 'cli-001': itens },
  });

const pedido = (numero, opcoes = {}) =>
  renderizarComProvedores(`/pedido/${numero}`, { comLayout: true, ...opcoes });

/* ============ 1. checkout: passo 1 ============ */
secao('checkout — endereço');
const p1 = checkout('?passo=1');
caso('titulo da pagina', p1.includes('Finalizar compra'));
caso('trilha com aria-label', p1.includes('aria-label="Etapas do checkout"'));
caso('h2 do passo', p1.includes('Endereço e entrega'));
caso('h2 recebe foco programatico', /id="titulo-do-passo"[^>]*tabindex="-1"/.test(p1));
caso('endereco vem pre-preenchido do cliente', p1.includes('value="58429-140"'));
caso('logradouro pre-preenchido', p1.includes('value="Rua Aprígio Veloso"'));
caso('escolha de modalidade', p1.includes('Entrega no meu endereço') && p1.includes('Retirar na sede da editora'));
caso('todo campo tem label', p1.includes('for="endereco-cep"') && p1.includes('for="endereco-uf"'));
/* Erro de campo é anunciado por aria-describedby ao receber foco, não por
   região viva própria — só existe uma região viva por página, o resumo. */
caso('so uma regiao aria-live na pagina (resumo unico)', (p1.match(/aria-live="polite"/g) ?? []).length === 1);
caso('cada campo tem id proprio para aria-describedby', p1.includes('id="erro-cep"') && p1.includes('id="erro-uf"'));
caso('sem erro visivel antes de tocar', !p1.includes('CEP inválido'));
caso('botao continuar', p1.includes('Continuar'));
caso('volta para o carrinho no primeiro passo', p1.includes('Voltar ao carrinho'));

/* ============ 2. guarda de passo pela URL ============ */
secao('checkout — guarda de passo');
caso('?passo=4 sem frete cai no passo 2', checkout('?passo=4').includes('>Frete</h2>'));
caso('?passo=3 sem frete cai no passo 2', checkout('?passo=3').includes('>Frete</h2>'));
caso('?passo=abc cai no primeiro pendente', checkout('?passo=abc').includes('>Frete</h2>'));
caso('?passo=99 cai no primeiro pendente', checkout('?passo=99').includes('>Frete</h2>'));
caso('sem parametro cai no primeiro pendente', checkout('').includes('>Frete</h2>'));
caso('?passo=1 e permitido (voltar)', checkout('?passo=1').includes('>Endereço e entrega</h2>'));

/* ============ 3. frete ============ */
secao('checkout — frete');
const p2 = checkout('?passo=2');
caso('lista as duas opcoes', p2.includes('Entrega padrão') && p2.includes('Entrega expressa'));
caso('transportadoras', p2.includes('Correios — PAC') && p2.includes('Correios — SEDEX'));
caso('valor em mono', p2.includes('R$ 21,00'));
caso('prazo em dias uteis', p2.includes('2 dias úteis'));
caso('prazo no singular quando e 1', p2.includes('1 dia útil'));
caso('cep aparece no enunciado', p2.includes('58429-140'));
caso('radio por opcao', p2.includes('id="frete-frete-padrao"') && p2.includes('id="frete-frete-expresso"'));

const gratis = checkout('?passo=2', [{ produtoId: 'prod-009', quantidade: 1, precoUnitario: 44900 }]);
caso('frete gratis aparece como palavra', gratis.includes('>Grátis<'));
caso('frete gratis nao mostra R$ 0,00', !gratis.includes('R$ 0,00'));
/* Endereço da cli-001 é na Paraíba: kit de 2730 g = 3 kg, base 1200 + 900×3
   = 3900, expresso 3900 × 1,8 = 7020. */
caso('expresso segue pago no frete gratis', gratis.includes('R$ 70,20'));

/* ============ 4. só e-book ============ */
secao('checkout — só e-book');
const ebook = checkout('', EBOOK);
caso('pula direto para o pagamento', ebook.includes('>Pagamento</h2>'));
caso('avisa por que pulou', ebook.includes('Pedido só com e-book') && ebook.includes('não há endereço nem frete'));
caso('passo de pagamento tambem so tem a regiao unica da pagina', (ebook.match(/aria-live="polite"/g) ?? []).length === 1);
caso('trilha so tem 2 passos', (ebook.match(/Etapas do checkout/g) ?? []).length === 1 && !ebook.includes('Endereço e entrega'));
caso('sem passo de frete', !ebook.includes('>Frete</h2>'));
caso('?passo=1 num pedido de e-book cai no pagamento', checkout('?passo=1', EBOOK).includes('>Pagamento</h2>'));

/* ============ 5. carrinho vazio ============ */
secao('checkout — carrinho vazio');
const vazio = checkout('', []);
caso('nao renderiza o fluxo', !vazio.includes('Etapas do checkout'));
caso('explica', vazio.includes('Não há o que finalizar.'));
caso('oferece o catalogo', vazio.includes('Ver catálogo'));

/* ============ 6. pedido: PIX vencido (ped-003) ============ */
secao('pedido — PIX vencido');
const vencido = pedido('CPA-2026-0141');
caso('numero em mono', vencido.includes('CPA-2026-0141'));
caso('status legivel', vencido.includes('Aguardando pagamento'));
caso('reconhece a cobranca vencida', vencido.includes('Cobrança expirada'));
caso('diz quando venceu', vencido.includes('26/02/2026'));
caso('oferece gerar nova cobranca', vencido.includes('Gerar nova cobrança'));
caso('SEM botao de simular pagamento', !vencido.includes('Simular pagamento'));
caso('SEM bloco de copia e cola', !vencido.includes('PIX copia e cola'));
caso('SEM QR quando expirada', !/Código PIX de/.test(vencido));

/* ============ 7. pedido: os demais estados ============ */
secao('pedido — outros estados');
const entregue = pedido('CPA-2026-0139');
caso('e-book entregue mostra downloads', entregue.includes('Seus arquivos'));
caso('um link por formato', entregue.includes('>pdf<') && entregue.includes('>epub<'));
caso('mostra downloads restantes', entregue.includes('5 downloads restantes'));
caso('diz que os links sao ficticios', entregue.includes('links são fictícios'));
caso('entrega por download', entregue.includes('Entrega por download'));

const enviado = pedido('CPA-2026-0140');
caso('fisico mostra endereco', enviado.includes('Avenida Paulista'));
caso('mostra a opcao de frete', enviado.includes('Entrega padrão'));
caso('mostra o rastreio', enviado.includes('BR748291035CG'));
caso('frete gratis como palavra', enviado.includes('>Grátis<'));
caso('historico como linha do tempo', enviado.includes('Acompanhamento') && enviado.includes('Em separação'));
caso('sem bloco de PIX', !enviado.includes('Pague com PIX'));

const recusado = pedido('CPA-2026-0142');
caso('pedido cancelado mostra o status', recusado.includes('Cancelado'));
caso('retirada mostra a sede', recusado.includes('COMPIA Editora — Sede'));

/* ============ 8. pedido: PIX em aberto (renovado) ============ */
secao('pedido — PIX em aberto');
const futuro = new Date(Date.now() + 20 * 60 * 1000).toISOString();
const emAberto = pedido('CPA-2026-0141', {
  pedidos: [
    {
      ...JSON.parse(JSON.stringify({
        id: 'ped-003', numero: 'CPA-2026-0141', clienteId: 'cli-003',
        itens: [{ produtoId: 'prod-002', titulo: 'Arquitetura de Sistemas Inteligentes', tipo: 'fisico', quantidade: 1, precoUnitario: 21500 }],
        subtotal: 21500, entrega: { modalidade: 'envio', valor: 0 }, total: 21500,
        status: 'aguardando_pagamento',
        historico: [{ status: 'aguardando_pagamento', em: '2026-08-04T12:00:00Z' }],
        criadoEm: '2026-08-04T12:00:00Z', atualizadoEm: '2026-08-04T12:00:00Z',
      })),
      pagamento: {
        metodo: 'pix', status: 'pendente', valor: 21500, parcelas: 1,
        chavePix: '5f8c9a12-3b7d-4e6f-9a0c-1d2e3f4a5b6c',
        payloadPix: '00020126FAKEPAYLOADEMABERTO6304ABCD',
        expiraEm: futuro,
      },
    },
  ],
});
caso('mostra o codigo copia e cola', emAberto.includes('PIX copia e cola'));
caso('payload num campo copiavel', emAberto.includes('00020126FAKEPAYLOADEMABERTO6304ABCD'));
caso('campo do payload tem label', emAberto.includes('for="payload-pix"'));
caso('desenha o QR em SVG', /<svg[^>]*role="img"|<svg[^>]*viewBox/.test(emAberto));
caso('QR tem titulo acessivel', emAberto.includes('Código PIX de R$ 215,00'));
caso('QR usa as cores do tema', emAberto.includes('#101418'));
caso('rotulo do copia e cola', emAberto.includes('PIX copia e cola'));
caso('avisa que o pagamento nao e aceito', emAberto.includes('nenhum aplicativo de banco vai aceitar'));
caso('oferece simular pagamento', emAberto.includes('Simular pagamento'));
caso('diz que nao ha integracao bancaria', emAberto.includes('não tem integração bancária'));
caso('SEM bloco de expirada', !emAberto.includes('Cobrança expirada'));

/* ============ 9. pedido inexistente ============ */
secao('pedido — inexistente');
const inexistente = pedido('CPA-2026-9999');
caso('mensagem propria, na propria rota', inexistente.includes('Não encontramos este pedido.'));
caso('oferece a conta', inexistente.includes('Ver meus pedidos'));
caso('oferece o catalogo', inexistente.includes('Ver catálogo'));
caso('nao renderiza pedido', !inexistente.includes('Acompanhamento'));

encerrar();
