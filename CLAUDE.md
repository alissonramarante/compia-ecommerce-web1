# COMPIA Editora — Loja Virtual (frontend)

Projeto acadêmico (UFCG). E-commerce da COMPIA, editora de materiais técnicos
de Inteligência Artificial: livros físicos, e-books, revistas e kits.

## Escopo

**Somente frontend.** Não existe backend, banco, autenticação real nem
integração de pagamento. Todo dado vem de `src/mocks/` e todo estado vive em
memória, persistido em `localStorage` para sobreviver ao refresh.

A especificação original pedia WordPress + WooCommerce. Aqui as regras de
negócio são **simuladas** assim:

| Requisito da spec | Simulação neste projeto |
| --- | --- |
| Gateway de pagamento (PagSeguro, Stripe…) | Formulário validado localmente. Cartão passa por Luhn + validade + CVV. Sempre "aprova", exceto o cartão de teste `4000 0000 0000 0002`, que recusa. |
| PIX com QR Code | QR gerado no cliente a partir de uma string fake de payload + chave aleatória fictícia. Botão "Simular pagamento" muda o pedido para `pago`. |
| Integração com Correios | `calcularFrete(cep, itens)` usa `tabelaFrete` (faixas de CEP por região) + peso. Prazo em dias úteis. |
| Retirada no local | Opção de entrega com frete zero e endereço fixo da editora. |
| Entrega de e-book | Link de download fictício na área do cliente, liberado quando o pedido está `pago`. |
| Notificação por e-mail | Toast "E-mail de confirmação enviado para …" + registro em `LogAtividade`. |
| Cálculo de impostos | Campo exibido como já incluso no preço (padrão brasileiro). Não calcular à parte. |
| Login por perfis | `login(email)` procura em `usuarios` mock. Sem senha real. |

## Stack

- Vite + React 18 + TypeScript (strict)
- React Router v6
- Tailwind CSS
- Context API + `useReducer` para carrinho, sessão e dados administrativos
- Sem lib de componentes pronta. Ícones: `lucide-react`.
- `qrcode.react` para o QR do PIX. Autorizada por exceção: gerar QR à mão exige
  Reed-Solomon sobre GF(256) e escolha de máscara, e sem scanner o resultado
  seria plausível e não verificável. Zero dependências de runtime.
- **Dependência nova exige aprovação**, com tamanho e árvore transitiva
  verificados antes de instalar. `npm install --dry-run` reconta binários
  opcionais de plataforma; compare com a linha de base para isolar o que a
  dependência realmente acrescenta.

## Estrutura

```
src/
  types/index.ts        # fonte única de verdade dos tipos
  mocks/                # dados iniciais (nunca mutados diretamente)
  contexts/             # CarrinhoContext, SessaoContext, DadosContext
  hooks/
  lib/                  # frete.ts, pagamento.ts, formatadores.ts, luhn.ts
  components/           # reutilizáveis, burros (sem fetch, sem contexto global)
  paginas/              # uma pasta por rota
  paginas/admin/
```

## Convenções de código

- **Mecânica em `lib/`, casca em `hooks/`.** Regra de negócio e decisão
  (quando escrever, se empilha histórico, como reconciliar) vive em `src/lib/`
  como função pura, testável sem DOM. O hook só liga isso ao React. O projeto
  não tem jsdom e não pode instalar: o que não for testável sem DOM é
  efetivamente não testado.
- **Testes ficam em `testes/`, na raiz do repositório, versionados.** Fora do
  `include` do `tsconfig.json`, para não entrarem no build nem no `tsc --noEmit`,
  mas dentro do git. "Fora de `src/`" significa fora do bundle, nunca fora do
  controle de versão. `npm run testes` roda todas as suítes em sequência e tem
  que funcionar num clone limpo, sem depender de estado de sessão.
- **Arnês único:** `testes/arnes.tsx` expõe `renderizarComProvedores(rota, opcoes)`,
  espelhando a árvore de providers de `App.tsx` e aceitando estado inicial
  (sessão, carrinhos por cliente, conteúdo bruto corrompido, ausência de
  `localStorage`, armazenamento hostil). Provider novo entra como uma linha no
  arnês, não como varredura nas suítes.
- **Teste de renderização** usa `renderToStaticMarkup` + `MemoryRouter`.
  Testes de mesa das funções puras ficam em comentário no próprio arquivo e são
  executados contra os mocks reais.
- **Nunca hardcodar valor derivado em prosa.** Percentual, soma e economia são
  calculados. Um "18% de desconto" escrito na descrição do mock desatualiza
  sozinho — foi exatamente o que aconteceu com `prod-009`.
- **Sentinelas de dado ficam em constante exportada**, não em string solta no
  JSX. Ex.: `AUTOR_COLETIVO` em `lib/produto.ts` — `'Vários autores'` é rótulo,
  não pessoa, e não vira link. Comparação exata, sem normalizar: normalizar
  esconderia inconsistência de cadastro num dado que é controlado.
- **Uma região `aria-live` por página.** Erro de campo é anunciado ao receber
  foco, via `aria-describedby`; a região viva recebe só o resumo ("3 campos
  precisam de correção") e mudanças sem campo dono (contagem de resultados,
  aviso do carrinho). Várias regiões disparando juntas produzem fala sobreposta
  e ilegível. Pelo mesmo motivo, valor derivado que muda a cada tecla (bandeira
  do cartão) fica visível mas não é anunciado.
- **ARIA só com o comportamento correspondente.** `role="tablist"` exige
  navegação por setas, `aria-controls` e `tabindex` gerenciado; sem isso, abas
  são links com `aria-current="page"`. Atributo sem comportamento é ARIA
  decorativo e engana o leitor de tela.
- **Cota de download é por entrada de pedido**, não por produto: comprar o mesmo
  e-book duas vezes dá duas cotas independentes. Somar ou deduplicar perderia
  dado do cliente. O consumo persiste — antes de apresentar, rode o reset de
  demonstração em `/entrar`.
- **Aviso pertence ao destino da navegação.** O relato de item indisponível na
  recompra aparece no carrinho, não na conta que foi deixada para trás. Só o
  caso "nada pôde ser adicionado" fica na origem, porque não há navegação.
- **Id de item em coleção é atribuído pelo reducer**, a partir de um contador no
  estado — nunca calculado pelo chamador a partir da lista atual. A ação carrega
  dados crus e o reducer monta o objeto. Dois `dispatch` no mesmo handler não
  veem o primeiro (o estado só atualiza no render seguinte), e encadear a lista à
  mão falha em silêncio com id duplicado. Vale para avisos do carrinho e logs.
- **Slug é gerado só na criação.** Na edição fica parado até alguém mudá-lo à
  mão, com aviso de que a URL publicada vai mudar. Regenerar a partir do título
  quebraria links, favoritos e abas abertas.
- **Esconder não é proteger.** O menu do admin omite o que o perfil não alcança
  **e** a rota barra de todo jeito, porque URL é digitável.
- **Cancelar devolve estoque, exceto em `enviado` e `entregue`** — nesses o
  produto já saiu fisicamente. `entregue` e `cancelado` são terminais na máquina
  de transições, e `erroDaMudancaDeStatus` roda antes de qualquer efeito, então
  clique duplo não infla estoque nem gera log falso.
- **`/admin/clientes` é somente leitura.** A spec pede acompanhamento, não
  cadastro. Tudo derivado do `PedidosContext`.

- Nomes de domínio em **português** (`Produto`, `adicionarItem`, `calcularFrete`).
  Nomes de API do React/Tailwind ficam em inglês, como são.
- Componentes funcionais, um por arquivo, export default.
- Toda função com lógica de negócio fica em `src/lib/` e é pura — nunca dentro
  do JSX. Componente chama, não calcula.
- Dinheiro sempre em **centavos, número inteiro**. Formatação só na renderização,
  via `formatarMoeda()`.
- Datas em ISO string.
- Sem `any`. Sem `!` para silenciar o TypeScript.
- Estágios comentados e numerados em arquivos longos de lógica.

## Rotas

```
/                       vitrine
/catalogo               busca, filtros por categoria/tipo/tag/preço
/produto/:slug          detalhe + ficha catalográfica
/carrinho
/checkout               endereço → frete → pagamento → confirmação (4 passos)
/pedido/:numero         confirmação e acompanhamento
/conta                  dados, pedidos, downloads de e-book
/entrar
/admin                  painel (protegido por perfil)
/admin/produtos         CRUD
/admin/pedidos          lista + mudança de status
/admin/logs             registro de atividade
```

### Parâmetros de `/catalogo`

Não existe rota `/categorias`: categoria é filtro do catálogo, não seção.

| Parâmetro | Efeito |
| --- | --- |
| `?visao=categorias` | Renderiza a grade das 6 categorias (nome, descrição, contagem de títulos) em vez da grade de produtos. Clicar numa categoria leva a `?categoria=slug`. |
| `?categoria=slug` | Filtra por uma categoria. Aceita repetição para múltiplas. Slug inexistente devolve lista vazia, não o catálogo inteiro. |
| `?busca=termo` | Termo de busca. Cobre título, subtítulo e autores, sem acento e sem caixa (normalização `NFD`). |
| `?tipo=fisico\|ebook\|kit` | Filtra por tipo. Aceita repetição. |
| `?tag=valor` | Filtra pela tag exata do mock, com o valor bruto (`?tag=deep%20learning`), não slugificado. Aceita repetição. Sem UI própria: alimentado pelos links de tag da página do produto. |
| `?precoMin=` / `?precoMax=` | Faixa de preço **em reais**, para o link ficar legível. A conversão para centavos acontece em `lerFiltrosDaUrl`, na fronteira. |
| `?estoque=1` | Somente itens disponíveis. |
| `?ordem=…` | Um dos valores de `OrdenacaoCatalogo`. Ordenação é apresentação, não filtro: não conta em `contarFiltrosAtivos` e sobrevive a "Limpar filtros". |

O estado dos filtros vive na URL, não em `useState`. A URL tem que ser
compartilhável e o botão voltar do navegador tem que funcionar.

Campo de texto (busca, preço) atualiza a URL com `{ replace: true }` enquanto
se digita, com debounce de ~250ms, e empilha uma entrada de histórico no
Enter/blur. Assim a filtragem é ao vivo sem transformar cada tecla num passo
do "voltar".

### Permissões

- `admin`: tudo.
- `editor`: produtos e categorias. Não vê pedidos nem logs.
- `vendedor`: pedidos e clientes. Produtos apenas leitura.

Rota bloqueada mostra tela "Você não tem acesso a esta área", não redirect silencioso.

## Direção visual

Não usar look de template genérico. A referência é **livro técnico brasileiro
bem impresso**: metadados em monoespaçada, hierarquia firme, muito branco.

Tokens (definir em `tailwind.config.js`, usar só estes):

```
tinta        #101418   texto e fundo escuro
papel        #EEF0EA   fundo (levemente frio, não creme)
azul         #23319E   ações primárias, links
riso         #FF4F7B   acento único: promoção, badge, foco — só preenche
ocre         #D9A521   alerta e estoque baixo — só preenche
ocre-texto   #8A6414   alerta e estoque baixo em texto
grafite      #5C6670   texto secundário, bordas
```

**Cor saturada preenche, cor escura escreve.** `riso` e `ocre` puros reprovam
WCAG AA como texto sobre fundo claro: 2,75:1 e 1,95:1 sobre `papel`. Como
preenchimento com texto escuro em cima, estão corretos. Para texto existe
`ocre-texto` — 4,67:1 sobre `papel` e 5,37:1 sobre `white`, matiz preservada
(41° contra 43°). `riso` **nunca** escreve: não há `riso-texto`, e o texto que
acompanha um selo `riso` vai em `tinta`.

Contraste é calculado pela fórmula WCAG e verificado em
`testes/verifica-contraste.mjs`, nunca estimado a olho. Lembre que a
apresentação é em projetor, onde 2,7:1 simplesmente desaparece.

Os tokens **substituem** a paleta do Tailwind, não a estendem: `bg-azul`
funciona, `bg-azul-500` não existe. Nenhum nome de token deve colidir com uma
paleta nativa do Tailwind — uma classe inexistente falha em silêncio, sem erro
de build. Foi por isso que `indigo` virou `azul`.

Tipografia (Google Fonts):

- Display: **Bricolage Grotesque** — títulos, com moderação.
- Corpo: **Source Serif 4** — descrições, texto longo. É uma editora.
- Utilitária: **IBM Plex Mono** — preço, ISBN, SKU, número de pedido, prazo.
  Monoespaçada onde o dado é *catalográfico* ou *numeral tabular* (quantidade,
  contador, prazo em dias) — nunca como decoração, nunca em texto corrido.

Elemento assinatura: a **ficha catalográfica** na página do produto — bloco em
Plex Mono com moldura fina reproduzindo a ficha CIP real (autor, título, ISBN,
CDU, páginas, edição). É o que diferencia esta loja de qualquer e-commerce.

Regras: `borderRadius` é **sobrescrito** no tema, de `none` a `lg`, entre 0 e
4px. `rounded-full` e `rounded-xl` não existem — badges e contadores são
retângulos de moldura fina, não pílulas. Onde um círculo for inevitável
(marcador de passo, radio), use valor arbitrário `rounded-[9999px]` e comente
o motivo.

**Acento x cor semântica.** `riso` é o único acento promocional ou decorativo,
e vale a regra de um por tela. `ocre` (estoque baixo, alerta) e um eventual
vermelho de erro são **semânticos**: comunicam estado, não decoram, e não
entram nessa conta. Um selo de promoção em `riso` e outro de estoque baixo em
`ocre` na mesma grade está correto.

Animação apenas em hover de card e transição entre passos do checkout.
Respeitar `prefers-reduced-motion`. Foco de teclado sempre visível
(anel `riso`).

## Microcópia

Português do Brasil, voz ativa, frase capitalizada (não Title Case).
O botão diz o que acontece: "Finalizar compra", não "Enviar".
Erro explica e diz como resolver: "CEP não encontrado. Confira os 8 dígitos."
Tela vazia convida: "Seu carrinho está vazio. Ver catálogo."

## Como trabalhar comigo (Claude Code)

- Entregue **uma fatia vertical por vez**, na ordem do roadmap. Não adiante fatias.
- Ao terminar uma fatia: rode `npm run build` **e** `npm run testes`, liste os
  arquivos criados e pare. Suíte quebrada é fatia incompleta, ainda que o build
  passe.
- Nunca edite `src/types/index.ts` sem avisar qual tipo mudou e por quê.
- Não instale dependência nova sem perguntar.
- Não crie backend, API route, nem `fetch` para serviço externo.

## Decisões já tomadas (não relitigar)

- **Build:** `tsc --noEmit && vite build`, com um `tsconfig.json` único que
  inclui `vite.config.ts`. Project references e `tsc -b` foram descartados
  (TS 5.9 recusa projeto referenciado com `noEmit`). Não reintroduzir
  `tsconfig.node.json`.
- **`main.tsx`** valida a existência de `#raiz` e lança erro explícito em vez
  de usar `!`.
- **`formatarData`** usa `America/Sao_Paulo` para timestamps e formata datas
  `AAAA-MM-DD` pelos dígitos, sem passar por `Date`, para não perder um dia.
- **Estado de filtro vive na URL**, não em `useState`.
- **Contagem por categoria é global**, não recalculada sobre o filtro ativo:
  mostra o que existe atrás de cada categoria, não o que sobrou. Recalcular
  faz as opções desaparecerem enquanto o usuário clica.
- **Tokens substituem a paleta do Tailwind** (ver Direção visual): `theme.colors`,
  não `theme.extend.colors`. Só `transparent`, `current`, `inherit`, `white`,
  `black` e os seis tokens existem. `bg-gray-100` quebra o build de propósito.
- **Função pura nunca chama `new Date()`.** A hora entra por parâmetro
  (`agora`), sempre. Vale para `validarValidade`, `cobrancaExpirada`,
  `criarPedido` e `aplicarPagamento`. Teste que depende do relógio quebra em
  janeiro.
- **Dados de cartão não saem do formulário.** Número completo, CVV e validade
  vivem no estado local do passo de pagamento. `Pagamento` guarda só os quatro
  últimos dígitos e a bandeira. Nada disso entra em contexto, `localStorage`
  ou log.
- **Pedido nasce em `aguardando_pagamento`**, mesmo com cartão já aprovado, e
  `aplicarPagamento` faz a transição. O histórico registra os dois momentos,
  como nos mocks.
- **Trocar de cliente com checkout em andamento aborta o checkout**, com aviso.
  O carrinho é por cliente (chave sufixada), então o fluxo perderia a base.
- **Alterar o CEP zera o frete escolhido.** As opções derivam dele; manter a
  escolha cobraria valor errado.

### Chaves de armazenamento

Todas versionadas, todas lidas com `try/catch` e validação de forma, nenhuma
confiável — `localStorage` é editável pelo usuário.

```
compia:carrinho:v1:{clienteId}   um carrinho por cliente
compia:sessao:v1                 só os ids; id inexistente cai no padrão
compia:pedidos:v1                semeado com os mocks só enquanto vazio
compia:produtos:v1               idem
compia:logs:v1                   idem
```

Depois da primeira gravação o armazenamento manda sobre os mocks, senão um
pedido criado no checkout seria engolido pela semente a cada recarga.

**Consequência que confunde no desenvolvimento:** com `compia:produtos:v1`
gravada, editar `src/mocks/produtos.ts` deixa de refletir na tela. Se um mock
alterado não aparecer, é isso — rode o reset de demonstração em `/entrar`.

## Limitações conhecidas (documentar, não consertar)

- **Duas abas se sobrescrevem.** A última a gravar vence. Resolver exigiria
  ouvir o evento `storage`; não vale para o escopo.
- **Estoque não é decrementado** ao criar pedido: `produtos` é array importado,
  imutável. A Fatia 7 introduz `ProdutosContext` para o CRUD e é lá que o
  pedido passa a baixar estoque.
- **Payload PIX é fictício.** O QR é legível, mas nenhum banco aceita a
  cobrança. Dito na própria tela, não só no commit.
- **Frete do `ped-003` divergente.** O mock registra R$ 37,36; a fórmula daria
  R$ 52,20. Pedido histórico registra o que foi cobrado e nada recalcula frete
  de pedido existente — fica como está.
- **Não há fluxo de devolução.** `entregue` e `cancelado` são terminais, e
  `StatusPagamento.estornado` existe no tipo sem nenhum caminho que o produza.
  Escolha de escopo, não esquecimento.
- **Não há CRUD de categorias.** A spec pede "suporte a novos produtos e
  categorias sem necessidade de programação" (ver `docs/especificacao-original.md`).
  Isso está atendido para produtos, via `ProdutosContext` (Fatia 7). Para
  categorias não: `src/mocks/categorias.ts` continua um array fixo, sem tela
  de admin nem contexto próprio. Adicionar uma categoria hoje exige editar
  esse arquivo e gerar um novo build.

**Percentual precisa de referência** quando há mais de uma base de comparação
na mesma tela, ou quando o número é a afirmação principal. Escreva "16% abaixo
do preço de tabela", não "(16%)". Selo de capa que só repete o da grade está
dispensado — em produto simples existe um único significado de desconto. Na
página do kit, ao contrário, conviviam dois denominadores (tabela do kit e soma
dos avulsos): lá o selo genérico foi suprimido e sobrou um único percentual,
rotulado.

## Roadmap

1. ~~Scaffold: Vite + TS + Tailwind + tokens + fontes + layout + rotas vazias~~ ✅
2. ~~Catálogo: grade de produtos, busca, filtros, ordenação~~ ✅
3. ~~Página do produto + ficha catalográfica~~ ✅
4. ~~Carrinho + contexto + persistência~~ ✅
5. ~~Checkout: endereço, frete, PIX e cartão, criação do pedido~~ ✅
6. ~~Área do cliente: pedidos, downloads de e-book~~ ✅
7. ~~Admin: login por perfil, CRUD de produtos, pedidos, logs~~ ✅
8. Polimento: responsivo, estados vazios, acessibilidade, README