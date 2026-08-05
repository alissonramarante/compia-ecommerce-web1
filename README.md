# COMPIA Editora — Loja Virtual

Loja virtual da COMPIA, editora de materiais técnicos de Inteligência
Artificial. Frontend em React com dados mocados, projeto da disciplina
(UFCG / CEEI / UASC).

## Escopo

**Este projeto é só frontend.** Não há backend, banco de dados, autenticação
real nem gateway de pagamento. Todo dado inicial vem de mocks em
`src/mocks/` e todo o estado da aplicação vive em memória, persistido no
`localStorage` do navegador para sobreviver a um recarregamento de página.

A especificação original do trabalho pedia uma loja em WordPress +
WooCommerce integrada a serviços reais (gateway de pagamento, Correios,
e-mail). Aqui, cada uma dessas peças foi **simulada** no cliente:

| Requisito da especificação | Como foi simulado aqui |
| --- | --- |
| Gateway de pagamento (PagSeguro, Stripe…) | Formulário de cartão validado localmente: número passa pelo algoritmo de Luhn, confere validade e CVV. Qualquer cartão válido é aprovado, exceto o cartão de teste `4000 0000 0000 0002`, que é sempre recusado. Nada é enviado para fora do navegador. |
| PIX com QR Code | O QR é gerado de verdade no navegador, a partir de uma string de payload e uma chave fictícias. Nenhum banco reconhece essa cobrança. Um botão "Simular pagamento" muda o pedido para pago, no lugar do aplicativo do banco. |
| Integração com Correios (frete) | Uma função calcula o frete a partir do CEP (por faixa de região) e do peso dos itens, com prazo em dias úteis — sem chamar nenhuma API externa. |
| Retirada no local | Uma opção de entrega com frete zero, usando o endereço fixo (fictício) da editora. |
| Entrega de e-book | Um link de download fictício aparece na área do cliente assim que o pedido é marcado como pago. |
| Notificação por e-mail | Um aviso na tela ("E-mail de confirmação enviado para...") e um registro no log de atividade, no lugar do envio real. |
| Cálculo de impostos | Os preços já exibem o valor final, como é praxe no varejo brasileiro — não há cálculo de imposto à parte. |
| Login por perfis | O login busca o e-mail digitado numa lista fixa de usuários. Não existe senha nem sessão de servidor. |

## Pré-requisitos

- **Node.js 18 ou superior** e **npm**. Para conferir o que já está instalado:
  ```
  node -v
  npm -v
  ```
  Se não tiver, baixe em <https://nodejs.org> (a versão LTS já inclui o npm).
- **Git**, para clonar o repositório.
- Um **navegador atual** (Chrome, Firefox, Edge). Não é preciso PHP, MySQL,
  WordPress nem qualquer outro servidor — ao contrário do que a especificação
  original sugeria, este projeto roda inteiramente no navegador.

## Como executar

```
git clone <url>
cd Compia
npm install
npm run dev
```

O terminal mostra o endereço, normalmente `http://localhost:5173`. Se a porta
5173 já estiver em uso, o Vite escolhe a próxima livre (5174, 5175...) e
mostra o endereço correto na mesma mensagem — não é preciso configurar nada.

Scripts disponíveis (`package.json`):

| Script | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento, com recarregamento automático a cada alteração. |
| `npm run build` | Confere os tipos (`tsc --noEmit`) e gera a versão de produção em `dist/`. |
| `npm run preview` | Serve o conteúdo de `dist/` localmente, para conferir o build antes de publicar. |
| `npm run testes` | Roda as suítes de teste do projeto (ver [Testes](#testes)). |

## Contas de demonstração

Não há cadastro de usuário nesta demonstração: a lista de contas já vem
pronta nos mocks.

### Equipe (acesso ao `/admin`)

Em `/entrar`, use qualquer um destes e-mails — **não há senha**, porque não
existe backend e autenticação real está fora do escopo do projeto:

| E-mail | Perfil | Alcança |
| --- | --- | --- |
| `renata@compia.com.br` | admin | tudo: produtos, pedidos, clientes, logs |
| `gustavo@compia.com.br` | editor | produtos e categorias |
| `claudia@compia.com.br` | vendedor | pedidos e clientes; produtos só leitura |
| `otavio@compia.com.br` | vendedor (inativo) | nada — serve para demonstrar uma conta desativada |

### Clientes (compras na loja)

Também em `/entrar`, é possível assumir a identidade de um destes clientes.
Trocar de cliente troca o carrinho e o histórico de pedidos junto — cada um
tem o seu:

| Nome | Cidade |
| --- | --- |
| Yasmim Oliveira | Campina Grande/PB |
| Eduardo Sampaio | São Paulo/SP |
| Larissa Fontes | Salvador/BA |

## Como navegar

Um roteiro sugerido para conhecer a loja de ponta a ponta:

1. **Vitrine** (`/`) — produtos em destaque e acesso rápido às categorias.
2. **Catálogo** (`/catalogo`) — busca sem acento e sem diferenciar caixa,
   filtros por categoria, tipo e faixa de preço, tudo refletido na URL (dá
   para copiar o link e compartilhar o filtro). Abra a página de um produto
   físico para ver a **ficha catalográfica** (bloco em fonte monoespaçada
   reproduzindo uma ficha CIP real), a de um **kit** para ver a comparação de
   preço contra a soma dos avulsos, e a de um **e-book**.
   Procure também um título esgotado, para ver o estado de indisponível.
3. **Carrinho e checkout**, em quatro passos: endereço (ou retirada na sede),
   frete calculado pela faixa do CEP, forma de pagamento, e confirmação.
   - **Dados de teste para pagamento**: qualquer número de cartão válido pelo
     algoritmo de Luhn é aprovado — por exemplo, `4539 5787 6362 1486`.
     `4000 0000 0000 0002` é sempre recusado, para testar o fluxo de erro.
     Use qualquer validade futura (formato MM/AA) e CVV de 3 dígitos (4 para
     cartões Amex, que começam com 34 ou 37).
   - **PIX**: o QR Code é gerado de verdade no navegador, mas o payload é
     fictício — nenhum aplicativo de banco vai reconhecer essa cobrança. Use
     o botão "Simular pagamento" para avançar o pedido como se o PIX tivesse
     sido pago.
4. **Área do cliente** (`/conta`) — pedidos feitos, downloads de e-book (cada
   compra dá uma cota própria de downloads, mesmo repetindo o título) e dados
   cadastrais, com o CPF mascarado por padrão.
5. **Painel administrativo** (`/admin`) — entre com cada um dos quatro
   e-mails da equipe (veja a tabela acima) e note o menu mudando conforme o
   perfil. Depois, tente digitar direto na barra de endereço uma URL que o
   perfil logado não alcança (por exemplo, `/admin/logs` como `vendedor`) —
   a proteção também barra por rota, não só esconde o link do menu.
6. **Reset de demonstração**, em `/entrar` — apaga tudo que a navegação
   gravou no `localStorage` (carrinhos, sessão, pedidos criados, produtos
   editados, logs) e devolve a loja ao estado original dos mocks. Estoque e
   cota de downloads são consumidos pelo uso normal da loja, então **rode o
   reset antes de avaliar**, para começar de um estado limpo e conhecido.

<!-- captura de tela: vitrine (/) -->
<!-- captura de tela: página de produto com a ficha catalográfica -->
<!-- captura de tela: checkout, passo de pagamento -->
<!-- captura de tela: painel admin, lista de produtos -->

## Arquitetura

```
src/
  types/index.ts        # fonte única de verdade dos tipos
  mocks/                 # dados iniciais (nunca mutados diretamente)
  contexts/              # CarrinhoContext, SessaoContext, ProdutosContext, PedidosContext, LogsContext
  hooks/                 # useCarrinho, useSessao, useProdutos, usePedidos, useLogs...
  lib/                   # regra de negócio pura: frete.ts, pagamento.ts, checkout.ts, formatadores.ts, luhn.ts...
  components/            # componentes reutilizáveis e "burros" (sem fetch, sem contexto global)
  paginas/               # uma pasta por rota
  paginas/admin/         # painel administrativo
```

A convenção seguida em todo o projeto: **`lib/` é puro, `hooks/` é casca,
`components/` é burro, a página orquestra**. Regra de negócio e decisão
(quando validar, como calcular frete, como transicionar o status de um
pedido) vive em `src/lib/` como função pura, sem React e sem efeito colateral
— o que permite testar sem subir um navegador. O hook só liga essa lógica ao
React (contexto, estado, efeitos). Componentes recebem dados prontos por
`props` e não sabem de onde vieram.

Os contextos guardam:

- **`CarrinhoContext`** — itens do carrinho, um por cliente.
- **`SessaoContext`** — quem está logado: o membro da equipe (perfil de
  admin) e/ou o cliente cuja identidade foi assumida.
- **`ProdutosContext`** — o catálogo, com CRUD do painel administrativo e
  baixa de estoque na criação de pedido.
- **`PedidosContext`** — todos os pedidos, com criação e mudança de status.
- **`LogsContext`** — o registro de atividade do painel.

Cada contexto persiste no `localStorage`, sob uma chave própria e versionada:

```
compia:carrinho:v1:{clienteId}   um carrinho por cliente
compia:sessao:v1                 só os ids; id inexistente cai no padrão
compia:pedidos:v1                semeado com os mocks só enquanto vazio
compia:produtos:v1               idem
compia:logs:v1                   idem
```

Toda leitura do `localStorage` passa por `try/catch` e validação de forma —
o conteúdo nunca é assumido como confiável, porque é editável pelo usuário
pelas ferramentas do navegador. Depois da primeira gravação em cada chave, o
que está no armazenamento manda sobre os mocks (senão um pedido criado no
checkout seria apagado pela semente a cada recarga da página).

## Testes

```
npm run testes
```

Ao rodar neste estado do projeto, a saída é **29 suítes e 1.470 asserções**,
todas passando, em pouco mais de um segundo por suíte. O comando roda cada
suíte em sequência, sai com código diferente de zero se qualquer uma falhar,
e funciona num clone limpo, sem depender de nada que tenha ficado de uma
sessão anterior no navegador.

O que cada camada cobre:

- **Funções puras de `src/lib/`** — testadas diretamente, sem framework:
  cálculo de frete, validação de cartão (Luhn, bandeira, CVV), regras de
  checkout, transições de status de pedido, filtros e ordenação do catálogo,
  formatação de dinheiro/data/CPF, contraste de cor (ver abaixo), entre
  outras.
- **Reducers dos contextos** — testados fora do React, verificando que o
  estado nunca fica inconsistente (estoque não vai negativo, id de item novo
  nunca colide com um existente, carrinho sobrevive a conteúdo corrompido no
  `localStorage`).
- **Renderização das telas** — usando `renderToStaticMarkup` (React) dentro
  de um `MemoryRouter`, com um arnês comum (`testes/arnes.tsx`) que espelha a
  árvore de contextos de `App.tsx` e aceita estado inicial (sessão, carrinho,
  armazenamento ausente ou hostil). Cobre contagens, presença de rótulo em
  todo campo, filtros vindos da URL, estados vazios e a matriz de permissão
  por perfil no admin.
- **Contraste de cor** — a razão de contraste de cada par de tokens em uso é
  calculada pela fórmula WCAG de luminância relativa (não estimada a olho) em
  `testes/verifica-contraste.mjs`, com guarda estrutural para impedir que
  `text-riso` (em qualquer forma) ou `text-ocre` puro voltem a aparecer no
  código.

**Por que não há jsdom nem framework de teste** (Jest, Vitest, Testing
Library): o projeto optou por não instalar dependência de teste, o que
significa que **o que não for testável sem DOM é, na prática, não testado** —
e essa restrição empurra a arquitetura para o lado certo. É por isso que a
mecânica fica em `src/lib/` como função pura, testável com `setTimeout`
de verdade e mocks reais, e o hook é só a ligação fina que não daria para
testar de outra forma sem jsdom. Para a interface, `renderToStaticMarkup`
entrega o HTML de um render e as asserções conferem esse texto — não cobre
interação (clique, digitação, foco); o comportamento que depende disso tem
a decisão extraída para `lib/`, onde é testável, e o que sobra no componente
é só ligação.

Antes desta bateria de correções, uma auditoria estática (documentada em
[`AUDITORIA.md`](./AUDITORIA.md)) varreu o projeto inteiro contra as regras
deste README e do `CLAUDE.md` — acessibilidade, responsivo, consistência e
higiene — e listou cada achado com arquivo e linha, sem corrigir nada, antes
de decidir prioridade. As correções que vieram depois (uma região
`aria-live` por página, `aria-describedby` nos grupos de campo, contraste de
`ocre-texto`, entre outras) seguem essa lista item por item. Auditar antes de
corrigir faz parte do processo neste projeto, não é um passo descartável.

## Limitações conhecidas

Documentadas de propósito, não esquecidas:

- **Duas abas do navegador se sobrescrevem.** A última a gravar no
  `localStorage` vence. Resolver exigiria ouvir o evento `storage`; não fez
  parte do escopo.
- **O estoque só é decrementado a partir da Fatia 7** (quando o CRUD de
  produtos passou a viver em contexto, não mais num array importado e
  imutável). Pedidos criados antes disso na demonstração não afetam estoque.
- **O payload do PIX é fictício.** O QR é legível de verdade por qualquer
  leitor, mas nenhum banco aceita a cobrança — isso é dito na própria tela,
  não só aqui.
- **O frete de um pedido histórico específico diverge da fórmula atual**: o
  mock registra um valor que a fórmula recalcularia diferente. Isso é
  proposital — um pedido já feito registra o que foi cobrado no momento, e
  nada recalcula frete de pedido existente.
- **Não há fluxo de devolução ou estorno.** Pedido `entregue` e `cancelado`
  são estados terminais; o tipo até prevê um status de pagamento estornado,
  mas nenhum caminho da aplicação o produz. Escolha de escopo, não
  esquecimento.
- **Os links de download de e-book são fictícios** — nenhum arquivo real é
  servido.

## Publicação

`npm run build` gera a versão de produção em `dist/`, pronta para qualquer
hospedagem estática (Vercel, Netlify, GitHub Pages, um servidor próprio com
Nginx).

A especificação original sugeria publicar na **Vercel**. O repositório
inclui um `vercel.json` com reescrita de todas as rotas para `index.html`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Isso é necessário porque o roteamento desta aplicação acontece inteiramente
no navegador (React Router), e não no servidor. Sem essa reescrita, recarregar
a página em qualquer rota que não seja a raiz — por exemplo, `/catalogo` ou
`/produto/algum-slug` — resulta em **404**, porque o servidor tenta encontrar
um arquivo `catalogo` que não existe. Com a reescrita, todo caminho serve
`index.html`, e o React Router assume a partir daí. É a pegadinha mais comum
ao publicar uma SPA (single-page application).

## Créditos e contexto

Projeto acadêmico da disciplina de Construção de Interfaces (UFCG / CEEI /
UASC). A especificação original do trabalho pedia uma loja construída em
WordPress + WooCommerce; por orientação do próprio enunciado, ela foi
substituída por uma aplicação em React com dados mocados, documentada neste
README e em `CLAUDE.md`.
