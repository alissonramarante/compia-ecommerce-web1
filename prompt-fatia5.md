# Fatia 5 — Checkout

Leia CLAUDE.md antes de começar.

Esta é a maior fatia do roadmap. Três tarefas, **commite entre cada uma** e
pare para reportar. Mecânica pura primeiro, UI só na Tarefa 2.

Fonte de dados: só `src/mocks/`. Não editar `src/types/index.ts` — `Pedido`,
`Pagamento`, `Entrega` e `OpcaoFrete` já existem e devem ser respeitados como
estão.

---

## Tarefa 0 — Sessão

Hoje não existe cliente corrente, e `Pedido.clienteId` é obrigatório.

**`src/contexts/SessaoContext.tsx`** + `src/hooks/useSessao.ts`:

- `clienteCorrente: Cliente` — padrão `cli-001` (tem endereço na faixa de CEP
  `58`, prazo 2 dias, e já tem dois pedidos nos mocks).
- `usuarioCorrente: Usuario | null` — padrão `null`. Serve ao `/admin` na
  Fatia 7; **não** implemente proteção de rota agora.
- `entrarComoCliente(id)`, `entrarComoUsuario(email)`, `sairDaEquipe()`.
- Persistência em `compia:sessao:v1`, guardando **só os ids**, com as mesmas
  regras defensivas do carrinho: `try/catch`, validação de forma, id
  inexistente cai no padrão em vez de quebrar.

**`src/paginas/Entrar/index.tsx`** — uma tela, duas seções:

1. "Entrar como cliente": os três clientes do mock, com nome e cidade, para
   trocar o cliente corrente. Deixe claro na própria tela que é seletor de
   demonstração, não autenticação.
2. "Acesso da equipe": campo de e-mail conferido contra `usuarios`. E-mail
   inexistente ou usuário inativo (`otavio@compia.com.br`) mostra erro que
   explica. Sem senha.

Cabeçalho: o item "Conta" passa a mostrar o primeiro nome do cliente corrente.

---

## Tarefa 1 — Mecânica de frete, pagamento e pedido

Nenhuma UI nesta tarefa. Tudo puro e testável sem DOM.

### `src/lib/frete.ts`

- `validarCep(cep): boolean` — 8 dígitos, aceitando com ou sem hífen.
- `faixaDoCep(cep): FaixaFrete` — casa os 2 primeiros dígitos com
  `tabelaFrete`; sem correspondência devolve `faixaPadrao`.
- `calcularFrete(cep, itens, produtos): OpcaoFrete[]` — devolve padrão e
  expresso. Padrão: `taxaFixa + custoPorKg × peso`. Expresso aplica
  `fatorExpresso` (valor × 1,8; prazo ÷ 2, arredondado para cima, mínimo 1).
- Subtotal ≥ `limiteFreteGratis` zera **só a opção padrão**. Expresso continua
  pago — frete grátis não deve virar expresso grátis.
- Pedido só com e-book: devolve `[]`. Quem consome trata como entrega por
  download.
- Peso arredondado para cima em kg antes de multiplicar.

### `src/lib/pagamento.ts`

- `luhn(numero): boolean`.
- `detectarBandeira(numero): BandeiraCartao` — Visa, MasterCard, Elo, Amex,
  senão `desconhecida`.
- `validarValidade('MM/AA'): boolean` — mês 1–12 e não vencido. Compare contra
  uma data recebida por parâmetro, nunca `new Date()` dentro da função: função
  pura, teste determinístico.
- `validarCvv(cvv, bandeira): boolean` — 4 dígitos para Amex, 3 para o resto.
- `parcelasDisponiveis(total): number[]` — até 6x sem juros, parcela mínima
  R$ 30,00. Total baixo devolve só `[1]`.
- `processarCartao(dados, total): Pagamento` — sempre aprova, **exceto** o
  cartão de teste `4000 0000 0000 0002`, que devolve `recusado`. Guarda apenas
  os 4 últimos dígitos e a bandeira.
- `gerarCobrancaPix(total, agora): Pagamento` — payload fake determinístico,
  `chavePixLoja` dos mocks, `expiraEm` = agora + 30 min, status `pendente`.

**Nunca** montar número completo de cartão, CVV ou validade em objeto
persistido, log ou estado global. Os campos vivem no estado local do formulário
e morrem ali.

### `src/lib/pedido.ts`

- `gerarNumeroPedido(pedidos, ano): string` — formato `CPA-2026-0143`,
  sequencial a partir do maior número existente do ano.
- `criarPedido({ cliente, itens, produtos, entrega, pagamento, numero, agora }): Pedido`
  — monta `ItemPedido[]` com título e tipo **congelados**, calcula subtotal e
  total, e grava o primeiro `EventoPedido`.
- `montarDownloads(itens, produtos): DownloadEbook[]` — uma entrada por formato
  de cada e-book, `downloadsRestantes: 5`.
- `aplicarPagamento(pedido, pagamento, agora): Pedido` — transição de status
  com o evento correspondente no histórico. Aprovado com item físico vai para
  `pago`; retirada vai para `pronto_para_retirada`; só e-book vai para
  `entregue` e ganha `downloads`. Recusado vai para `cancelado`.

### `src/contexts/PedidosContext.tsx`

- Semeado com `pedidos` dos mocks, persistido em `compia:pedidos:v1`, mesmas
  regras defensivas.
- Expor `pedidos`, `pedidoPorNumero(numero)`, `pedidosDoCliente(clienteId)`,
  `adicionarPedido`, `atualizarPedido`.
- Reducer puro; escrita no `useEffect`.

---

## Tarefa 2 — UI do checkout

### Fluxo

Quatro passos, com `?passo=1..4` na URL para o voltar do navegador funcionar.
Os dados do formulário ficam em estado local do checkout, **não** em contexto
nem em `localStorage`.

1. **Endereço** — pré-preenchido com o endereço principal do cliente corrente,
   editável. Modalidade: entrega ou retirada no local (`localDeRetirada` dos
   mocks). Pedido só com e-book pula direto para o pagamento, com aviso.
2. **Frete** — só quando há item físico e a modalidade é entrega. Lista as
   opções de `calcularFrete`, com valor em mono e prazo em dias úteis. Frete
   grátis aparece como "Grátis", não "R$ 0,00". Retirada mostra endereço e
   horário da editora, sem opções.
3. **Pagamento** — PIX ou cartão.
   - PIX: informa que o QR aparece após confirmar. Não gere o QR aqui.
   - Cartão: número (com máscara e bandeira detectada ao digitar), nome,
     validade, CVV, parcelas. Validação no blur de cada campo, com mensagem que
     diz como resolver. O botão de confirmar só habilita com tudo válido.
4. **Confirmação** — resumo completo antes de criar o pedido: itens, endereço
   ou retirada, frete escolhido, meio de pagamento, subtotal, frete e total.
   Nada de surpresa após o clique.

Passo bloqueado por falta de dado anterior não pode ser acessado pela URL:
`?passo=3` sem endereço redireciona ao primeiro passo pendente.

### Ao confirmar

- Cria o pedido, adiciona ao `PedidosContext`, **limpa o carrinho** e navega
  para `/pedido/:numero` com `replace: true`, para o voltar não reenviar.
- Cartão recusado **não** cria pedido navegável: mostra o erro no passo 3 com o
  carrinho intacto. (O `ped-004` dos mocks é um recusado histórico; não replique
  esse fluxo em pedido novo.)

### `src/paginas/Pedido/index.tsx`

- Número em mono, status legível, histórico como linha do tempo.
- **PIX pendente:** QR Code renderizado no cliente a partir do payload — sem
  dependência nova, desenhe em SVG ou canvas a partir de uma implementação
  própria simples; se ficar inviável sem biblioteca, exiba o payload em mono
  num bloco copiável e diga por que o QR não está lá. Botão "Simular pagamento"
  aplica `aplicarPagamento` e atualiza a tela. Mostrar `expiraEm`.
- E-book pago: links de download por formato, com `downloadsRestantes`. Os
  links são fictícios — deixe isso explícito na tela.
- Físico: endereço, opção de frete, prazo, e `codigoRastreio` quando existir.
- Número inexistente: "Não encontramos este pedido." + link, na própria rota.

### Restrições

- Nenhuma dependência nova. Sem lib de máscara, sem lib de QR, sem toast.
- `components/` continua burro. Quem chama hook é página.
- Sem `fetch`, sem backend, sem `setTimeout` fingindo latência de rede.
- Máscaras não podem impedir colar um número de cartão inteiro.
- Cada passo tem `<h2>`, foco movido para o topo do passo na transição, e erro
  anunciado em `aria-live`. Formulário navegável só por teclado.
- Testes: suítes novas para `frete`, `pagamento` e `pedido` (incluindo CEP
  inválido, faixa desconhecida, frete grátis não afetando o expresso, Luhn com
  o cartão de teste, validade vencida com data injetada, sequência do número de
  pedido e as quatro transições de `aplicarPagamento`). Preservar as 330
  asserções atuais.

Ao terminar cada tarefa: `npm run build`, mostre a saída, liste os arquivos e
pare. Não comece a Fatia 6.
