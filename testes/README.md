# Suítes de teste

```
npm run testes              # roda as dezessete em sequência
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
| `verifica-carrinho` | `lib/carrinho`, `lib/carrinhoArmazenado` e o reducer: limites, `localStorage` hostil, reconciliação, carrinho por cliente, migração da chave antiga |
| `verifica-sessao` | `lib/sessao`, `lib/sessaoArmazenada` e o reducer: acesso da equipe, conta inativa, resolução contra os mocks |
| `verifica-frete` | `lib/frete`: validação de CEP, faixas, arredondamento por quilo, frete grátis não contaminando o expresso |
| `verifica-pagamento` | `lib/pagamento`: Luhn, bandeiras (Elo antes de Visa), validade com data injetada, parcelas, PIX determinístico, e que nenhum dado sensível sai no `Pagamento` |
| `verifica-demonstracao` | `lib/demonstracao`: varredura de chaves por prefixo (inclusive uma chave que ainda não existe) e reset |
| `verifica-conta` | `lib/conta`: abas, tempo restante do PIX, agregação de downloads em cotas independentes, recompra com item indisponível, máscara de CPF |
| `verifica-checkout` | `lib/checkout`: quais passos existem, guarda de passo pela URL, validação de endereço e cartão, máscaras, cobrança PIX vencida e renovação |
| `verifica-pedido` | `lib/pedido`, `lib/pedidosArmazenados` e o reducer: numeração sequencial, congelamento de título e tipo, as quatro transições de `aplicarPagamento` |
| `verifica-render` | Tela do catálogo: contagens, filtros vindos da URL, estado vazio |
| `verifica-produto-render` | Tela do produto: ficha CIP, selos, kit, e-book, esgotado, slug inexistente |
| `verifica-carrinho-render` | Tela do carrinho: tabela, resumo, avisos, contador do cabeçalho |
| `verifica-entrar-render` | Tela de entrar: seletor de cliente, acesso da equipe, cabeçalho |
| `verifica-conta-render` | As três abas da conta, aba inválida, PIX em aberto e expirado, estado vazio, cota zerada, CPF mascarado |
| `verifica-checkout-render` | Telas de checkout e pedido: os quatro passos, guarda por URL, frete grátis, PIX vencido e em aberto, downloads, pedido inexistente |

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
