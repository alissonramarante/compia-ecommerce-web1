# Fatia 6 — Área do cliente

Leia CLAUDE.md antes de começar. Ele foi atualizado com as decisões da Fatia 5,
as chaves de armazenamento e uma seção nova, "Limitações conhecidas".

Fatia curta: quase tudo já existe. O trabalho é reunir, não inventar. Antes de
escrever componente novo, verifique se `CartaoProduto`, `ROTULO_DE_STATUS`,
`formatadores`, `usePedidos`, `useSessao` e `useCarrinho` já resolvem.

Fonte de dados: só `src/mocks/` e os contextos. Não editar `src/types/index.ts`.

Duas tarefas. Commite entre elas.

---

## Tarefa 0 — Restaurar dados de demonstração

Depois de algumas compras de teste o `localStorage` fica sujo, e a Fatia 7 vai
editar produtos e pedidos. Precisa de botão de reset antes disso — inclusive
como rede durante a apresentação.

- `src/lib/demonstracao.ts`: `restaurarDemonstracao()` remove **todas** as
  chaves com prefixo `compia:` — descubra por varredura de `localStorage`, não
  por lista fixa, senão uma chave nova da Fatia 7 fica órfã. Dentro de
  `try/catch`.
- Depois de limpar, recarregue a página (`location.reload()`) para os providers
  ressemearem a partir dos mocks. É a solução honesta: reconstruir três
  contextos à mão convidaria a inconsistência.
- Onde fica: na tela `/entrar`, que já se declara de demonstração. Seção
  própria, ao pé da página, com texto dizendo exatamente o que será apagado
  (carrinhos, sessão e pedidos criados) e que os dados dos mocks voltam.
- Pede confirmação, porque é destrutivo e irreversível — ao contrário de remover
  item do carrinho, que se refaz em dois cliques.

---

## Tarefa 1 — `/conta`

### Abas na URL

`?aba=pedidos` (padrão), `?aba=downloads`, `?aba=dados`. Mesma convenção do
catálogo: estado na URL, aba compartilhável, voltar funciona. Aba inválida cai
no padrão.

### Aba "pedidos"

- Só os pedidos do cliente corrente (`pedidosDoCliente`), mais recente primeiro.
- Cada linha: número em mono, data, status legível com cor semântica
  (`ocre` para aguardando, `grafite` para cancelado, sem `riso`), quantidade de
  itens, total em mono, e link para `/pedido/:numero`.
- **PIX pendente e não expirado** ganha destaque com o tempo restante — é ação
  pendente do cliente, não histórico.
- **PIX expirado** aparece rotulado como tal, sem falsa urgência.
- Botão "Comprar de novo" por pedido: adiciona os itens ao carrinho respeitando
  `quantidadeMaxima`. Item indisponível hoje (produto removido ou estoque 0) é
  omitido e relatado em aviso, não silenciosamente. Se nada puder ser adicionado,
  não navegue — diga por quê.
- Estado vazio: "Você ainda não fez pedidos." + link para o catálogo. Todos os
  três clientes do mock têm pedido, então cubra esse caso pelo arnês.

### Aba "downloads"

- Reúne os `downloads` de todos os pedidos do cliente com status `pago` ou
  `entregue`. Agrupe por título, listando os formatos.
- Cada formato mostra `downloadsRestantes` em mono.
- Clicar registra o download: decrementa via `atualizarPedido` e exibe o aviso
  de que o link é fictício. Em zero, o link desabilita com explicação, não
  desaparece.
- A contagem é **por entrada de pedido**, não por produto: comprar o mesmo
  e-book duas vezes dá duas cotas independentes. Não some nem deduplique.
- Estado vazio: explica que e-books comprados aparecem aqui e diferencia de
  "nenhum pedido" — cliente com pedido só de físico não deve ver a mesma frase
  de quem nunca comprou.

### Aba "dados"

- Nome, e-mail, telefone e CPF **mascarado** (`***.456.789-**`), com botão
  "mostrar" que revela na sessão e não persiste a escolha. Máscara em
  `lib/formatadores.ts`.
- Endereços em blocos, com o principal marcado. **Somente leitura** — a spec
  pede histórico de compras, não gestão de endereço, e o checkout já permite
  editar o endereço da entrega.
- Seção "Acesso da equipe" com link para `/admin` **apenas** quando
  `usuarioCorrente` existir, mostrando nome e perfil. Sem proteção de rota
  ainda: é a Fatia 7.

### Restrições

- Nenhuma dependência nova.
- `components/` continua burro. Quem chama hook é página.
- Reaproveite `ROTULO_DE_STATUS` e os formatadores; não duplique texto de status.
- Cada aba com `<h2>`, navegação de abas com `role="tablist"` correto ou lista
  de links simples — o que for honesto com a marcação, sem ARIA decorativo.
- Testes: suíte nova para `lib/demonstracao.ts` e para a agregação de downloads
  (incluindo cota zerada, duas cotas do mesmo e-book, e pedido cancelado que
  **não** libera download), mais renderização das três abas, aba inválida,
  estado vazio de pedidos e o "Comprar de novo" com item indisponível.
  Preservar as 823 asserções atuais.

Ao terminar cada tarefa: `npm run build` **e** `npm run testes`, liste os
arquivos e pare. Não comece a Fatia 7.
