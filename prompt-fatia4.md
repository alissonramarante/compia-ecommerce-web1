# Fatia 4 — Carrinho

Leia CLAUDE.md antes de começar. Ele foi atualizado com as decisões das
Fatias 2 e 3: padrão `lib/` + `hooks/`, despacho por peso, sentinelas em
constante, tag por valor bruto e a regra de percentual com referência.

Esta é a primeira fatia com **estado global e persistência**. É onde há mais
chance de sair torto, então a ordem importa: mecânica pura primeiro, React
depois, UI por último.

## Fonte de dados

Só `src/mocks/`. Não editar `src/types/index.ts` — `ItemCarrinho` já existe e
já tem `precoUnitario`, que é o preço **congelado no momento da adição**.

---

## 1. `src/lib/carrinho.ts` — mecânica pura

Nada de React, nada de `localStorage` aqui. Funções puras sobre
`ItemCarrinho[]`, testáveis contra os mocks:

- `adicionarItem(itens, produto, quantidade): ItemCarrinho[]` — se o produto já
  está no carrinho, soma a quantidade em vez de duplicar a linha.
- `removerItem(itens, produtoId): ItemCarrinho[]`
- `alterarQuantidade(itens, produtoId, quantidade): ItemCarrinho[]` —
  quantidade 0 remove a linha.
- `quantidadeMaxima(produto): number` — `estoque` quando numérico; e-book
  sempre 1; `null` sem estoque definido usa um teto razoável documentado.
- `calcularSubtotal(itens): number`
- `contarItens(itens): number` — soma das quantidades, é o número do cabeçalho.
- `pesoTotal(itens, produtos): number` — em gramas, já pensando no frete da
  Fatia 5.

Regras que o reducer não pode deixar escapar, e que precisam de teste:

- **E-book tem quantidade sempre 1.** Não é só limite de UI: adicionar duas
  vezes o mesmo e-book continua 1.
- Quantidade nunca passa de `quantidadeMaxima`. Tentar adicionar 5 de
  `prod-006` (estoque 3) resulta em 3, não em erro.
- Produto com `estoque === 0` não entra no carrinho.

---

## 2. `src/lib/carrinhoArmazenado.ts` — serialização

- Chave versionada: `compia:carrinho:v1`.
- `serializar(itens): string` e `desserializar(bruto): ItemCarrinho[]`.
- **Nunca confiar no conteúdo lido.** `localStorage` é editável pelo usuário:
  valide forma e tipos, descarte silenciosamente o que não bate, e nunca deixe
  um JSON corrompido derrubar a aplicação. `desserializar('{{{')` devolve `[]`,
  não lança.
- Toda leitura e escrita dentro de `try/catch`: em modo privado do Safari
  `localStorage` existe mas lança ao escrever. Falha em gravar não pode quebrar
  o carrinho da sessão.

### Reconciliação com os mocks

Um carrinho salvo pode estar velho. Ao carregar, `reconciliar(itens, produtos)`
devolve os itens ajustados **e** a lista de avisos para exibir:

| Situação | Ação |
| --- | --- |
| `produtoId` não existe mais | Remove a linha, avisa. |
| `precoUnitario` difere do preço vigente | Atualiza para o vigente, avisa com o valor antigo e o novo. |
| quantidade acima do estoque atual | Reduz ao estoque, avisa. |
| estoque virou 0 | Remove a linha, avisa. |

Os avisos são texto pronto, gerado em `lib/`, não montado no JSX. Isso vira
relevante na Fatia 7, quando o admin editar preços com um carrinho aberto.

---

## 3. `src/contexts/CarrinhoContext.tsx`

- `useReducer` com o reducer **puro**, delegando a `lib/carrinho.ts`. O reducer
  não escreve em `localStorage` e não lê a hora — nada de efeito colateral.
- A escrita em `localStorage` acontece num `useEffect` que observa os itens.
- A leitura inicial acontece uma vez, no inicializador do `useReducer`, já
  reconciliada.
- Expor: `itens`, `quantidadeTotal`, `subtotal`, `adicionar`, `remover`,
  `alterarQuantidade`, `limpar`, `avisos`, `descartarAviso`.
- `useCarrinho()` em `src/hooks/useCarrinho.ts`, lançando erro claro se usado
  fora do provider.
- Provider entra em `App.tsx`, envolvendo as rotas.

---

## 4. Ligações no que já existe

- `BotaoAdicionarAoCarrinho`: o no-op `// Fatia 4` some. A página do produto
  passa o `adicionar` real. O componente continua burro — recebe a função,
  não chama o hook.
- `SeletorQuantidade` na página do produto define a quantidade adicionada.
- Cabeçalho: contador real, em mono, e o link para `/carrinho`. Zero itens
  mostra o ícone sem número, não um "0".
- **Feedback ao adicionar** — agora pode ser real: o botão troca para
  "Adicionado" por ~2s e a mudança é anunciada em região `aria-live="polite"`
  ("Fundamentos de Aprendizado Profundo adicionado ao carrinho. 3 itens.").
  Respeitar `prefers-reduced-motion`. Sem biblioteca de toast.

---

## 5. `src/paginas/Carrinho/index.tsx`

- Tabela de itens: capa pequena, título linkando para o produto, tipo,
  preço unitário em mono, `SeletorQuantidade`, total da linha, botão remover.
- E-book: sem seletor, com etiqueta "entrega por download".
- Resumo: subtotal em mono, peso total quando houver item físico, e o aviso de
  que frete e prazo são calculados no checkout. **Não calcule frete aqui** —
  é a Fatia 5.
- Botão "Finalizar compra" leva a `/checkout` (a rota existe como placeholder;
  não implemente o checkout).
- "Continuar comprando" leva a `/catalogo`.
- Avisos de reconciliação aparecem no topo, dispensáveis, com `aria-live`.
- Estado vazio: "Seu carrinho está vazio." + link para o catálogo. Sem tabela
  vazia, sem resumo zerado.
- Remover item confirma? **Não.** Uma linha removida por engano se refaz em dois
  cliques; um diálogo de confirmação a cada remoção é atrito pior.

---

## Restrições

- Nenhuma dependência nova. Sem biblioteca de estado, sem toast.
- `components/` continua burro: recebe props, não chama `useCarrinho`.
  Quem chama o hook são as páginas e o cabeçalho.
- Sem `fetch`, sem backend.
- Testes: suíte nova para `lib/carrinho.ts` e `lib/carrinhoArmazenado.ts`
  (incluindo JSON corrompido, item fantasma, preço alterado e estoque
  reduzido) e para o reducer, que é puro. Preservar as 203 asserções atuais.

Ao terminar: `npm run build`, mostre a saída, liste os arquivos criados e pare.
Não comece a Fatia 5.
