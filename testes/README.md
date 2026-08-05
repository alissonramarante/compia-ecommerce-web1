# Suítes de teste

```
npm run testes              # roda as vinte e nove em sequência
npm run testes -- --detalhado   # mostra a saída de cada asserção
node testes/verifica-carrinho.mjs   # roda uma só
```

Sai com código diferente de zero se qualquer suíte falhar, então serve de
porta — dá para plugar em hook ou CI sem adaptação. Sem falha, imprime só o
resumo; com falha, despeja a saída da suíte que quebrou.

## O que cada uma cobre

| Suíte | Cobre |
| --- | --- |
| `verifica-catalogo` | `lib/catalogo`: filtro, ordenação, busca sem acento, leitura da URL, contagem por categoria |
| `verifica-debounce` | `lib/campoDebounced`: digitar não empilha histórico, Enter/blur empilha, escrita sem mudança é descartada |
| `verifica-produto` | `lib/produto`: kit, economia, relacionados, quantidade, `AUTOR_COLETIVO` |
| `verifica-produtos` | `lib/produto` (`baixarEstoque`), `lib/produtosArmazenados` e o reducer do `ProdutosContext`: nunca fica negativo, e-book intocado, upsert por id, carga inicial |
| `verifica-carrinho` | `lib/carrinho`, `lib/carrinhoArmazenado` e o reducer: limites, `localStorage` hostil, reconciliação, carrinho por cliente, migração da chave antiga |
| `verifica-sessao` | `lib/sessao`, `lib/sessaoArmazenada` e o reducer: acesso da equipe, conta inativa, resolução contra os mocks |
| `verifica-frete` | `lib/frete`: validação de CEP, faixas, arredondamento por quilo, frete grátis não contaminando o expresso |
| `verifica-pagamento` | `lib/pagamento`: Luhn, bandeiras (Elo antes de Visa), validade com data injetada, parcelas, PIX determinístico, e que nenhum dado sensível sai no `Pagamento` |
| `verifica-demonstracao` | `lib/demonstracao`: varredura de chaves por prefixo (inclusive uma chave que ainda não existe) e reset |
| `verifica-conta` | `lib/conta`: abas, tempo restante do PIX, agregação de downloads em cotas independentes, recompra com item indisponível, máscara de CPF |
| `verifica-checkout` | `lib/checkout`: quais passos existem, guarda de passo pela URL, validação de endereço e cartão, máscaras, cobrança PIX vencida e renovação |
| `verifica-pedido` | `lib/pedido`, `lib/pedidosArmazenados` e o reducer: numeração sequencial, congelamento de título e tipo, as quatro transições de `aplicarPagamento`, `pedidoFoiPago`, `filtrarPedidos` (busca, status, cliente), `resumoDoCliente`, `contarPedidosPorStatus` e `receitaDosPedidosPagos` |
| `verifica-permissoes` | `lib/permissoes`: matriz perfil × área, `podeVer`, `podeEditar`, `areasVisiveis`, consistência (nunca edita o que não vê) |
| `verifica-produto-formulario` | `lib/produtoFormulario`: `gerarSlug`, `proximoSlugAoMudarTitulo` (editar título não regenera slug publicado), `gerarIdDeProduto`, ida e volta `paraDadosDoFormulario`/`montarProduto`, validação por tipo (físico, e-book, kit), ficha "tudo ou nada", colisão de slug |
| `verifica-status-pedido` | `lib/statusPedido`: matriz de transições válidas, os dois estados terminais não aceitam nenhuma transição (nem para si mesmos), `enviado` exige código de rastreio, `cancelamentoDevolveEstoque` (sim antes de enviado, não depois), `mudarStatus` grava evento e código de rastreio |
| `verifica-log` | `lib/log`, `lib/logsArmazenados` e o reducer do `LogsContext`: `criarLog` monta o registro com id sequencial, `filtrarLogs` (ação, usuário, mais recente primeiro), persistência |
| `verifica-contraste` | Razão de contraste WCAG de cada par de tokens em uso (`arnes.mjs`'s `razaoDeContraste`, fórmula de luminância relativa) — `tinta`/`azul`/`grafite`/`ocre-texto` sobre `papel`/`white` ≥4.5:1, `riso`/`ocre` puros continuam abaixo (por isso `ocre-texto` existe; `riso` não tem versão de texto), e guarda estrutural: nenhum `text-riso` em qualquer forma nem `text-ocre` puro sobrou em `src/` |
| `verifica-render` | Tela do catálogo: contagens, filtros vindos da URL, estado vazio |
| `verifica-produto-render` | Tela do produto: ficha CIP, selos, kit, e-book, esgotado, slug inexistente |
| `verifica-carrinho-render` | Tela do carrinho: tabela, resumo, avisos, contador do cabeçalho |
| `verifica-entrar-render` | Tela de entrar: seletor de cliente, acesso da equipe, cabeçalho |
| `verifica-conta-render` | As três abas da conta, aba inválida, PIX em aberto e expirado, estado vazio, cota zerada, CPF mascarado |
| `verifica-checkout-render` | Telas de checkout e pedido: os quatro passos, guarda por URL, frete grátis, PIX vencido e em aberto, downloads, pedido inexistente |
| `verifica-admin-render` | `AreaProtegida` e `LayoutAdmin`: tela de acesso restrito sem equipe logada, tela de acesso negado por área com o perfil e o que ele alcança, menu do painel variando por perfil, e a rota direta continuando protegida mesmo com o item escondido do menu |
| `verifica-admin-produtos-render` | CRUD de produtos: tabela com capa/tipo/preço/estoque/destaque, busca e filtro por tipo reaproveitando `lib/catalogo`, ações escondidas para `vendedor`, formulário de criar e editar variando por tipo (físico, e-book, kit), produto inexistente |
| `verifica-admin-pedidos-render` | Lista de pedidos (busca, filtro por status, filtro por cliente vindo de `/admin/clientes`), detalhe (itens, entrega, pagamento, histórico), transições de status oferecidas variando pelo estado atual, `editor` barrado |
| `verifica-admin-clientes-render` | Acompanhamento de clientes: dados derivados do `PedidosContext` (quantidade de pedidos, total gasto só nos pagos), CPF mascarado, link para os pedidos do cliente, somente leitura, `editor` barrado |
| `verifica-admin-logs-render` | Registro de atividade: autor por nome, ação legível, mais recente primeiro, filtro por ação e por usuário, só `admin` acessa |
| `verifica-admin-painel-render` | Números do painel variando por perfil (produtos/esgotados para todos que veem produtos, pedidos por status e receita só para quem vê pedidos), tudo derivado do contexto vivo |

## Arquitetura

`arnes.mjs` compila com esbuild e carrega os módulos do projeto. Nada de
caminho absoluto: tudo resolve a partir da própria localização do arquivo,
para um clone limpo funcionar.

`arnes.tsx` expõe `renderizarComProvedores(rota, opcoes)`, que espelha a
árvore de `App.tsx`. Provider novo entra ali, numa linha, em vez de virar
varredura nas suítes — foi o que aconteceu quando o `CarrinhoProvider` passou
a depender de `useSessao` e 62 asserções quebraram de uma vez.

```js
renderizarComProvedores('/carrinho', {
  comLayout: true,
  sessao:    { clienteId: 'cli-003', usuarioId: null },
  carrinhos: { 'cli-001': [/* itens */] },
  bruto:     { 'compia:sessao:v1': '{{{' },  // conteúdo corrompido
  semArmazenamento: true,                     // localStorage inexistente
  armazenamentoHostil: true,                  // lança em toda operação
});
```

Bundles intermediários vão para `testes/.cache/`, ignorado pelo git.

## Por que não há jsdom

O projeto não instala dependência de teste. A consequência é direta: **o que
não for testável sem DOM é efetivamente não testado**, e isso empurra a
arquitetura na direção certa.

É por isso que a mecânica vive em `src/lib/` como função pura e o hook é só a
casca — `criarControladorDeCampo` é testável com `setTimeout` de verdade,
`useCampoDebounced` não seria. Mesma coisa com os reducers, que são exportados
e testados fora do React.

Para a interface, `renderToStaticMarkup` dá o HTML de um render e as
asserções são sobre esse texto. Não cobre interação — clique, digitação,
foco. Comportamento que dependa disso precisa ter a decisão extraída para
`lib/`, onde dá para testar; o que sobra no componente é ligação.

Testes de mesa das funções puras ficam em comentário no próprio arquivo de
origem e são executados aqui contra os mocks reais, então comentário que
mente quebra a suíte.
