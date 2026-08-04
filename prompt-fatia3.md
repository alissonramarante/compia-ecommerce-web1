# Fatia 3 — Página do produto

Leia CLAUDE.md antes de começar. Ele foi atualizado com as decisões da Fatia 2:
tabela de parâmetros completa, regra de acento x cor semântica, contagem global
por categoria e a política de histórico em campo de texto.

Duas tarefas. Commite entre elas.

---

## Tarefa 0 — Busca e preço filtram ao digitar

Hoje busca e faixa de preço só aplicam no Enter/blur. O diagnóstico estava
certo (10 teclas = 10 entradas de histórico), mas a solução sacrificou a coisa
errada: `setSearchParams` aceita `{ replace: true }`, que atualiza a URL sem
empilhar entrada.

- Enquanto digita: `setSearchParams(proximos, { replace: true })`, com debounce
  de ~250ms.
- No Enter e no blur: `setSearchParams(proximos)` sem `replace`, empilhando uma
  entrada — o estado continua compartilhável e "voltável".
- O campo continua controlado pela URL, sem `useState` de filtro. Se precisar
  de estado local só para o texto sendo digitado antes do debounce, isole num
  hook (`useCampoDebounced`) e deixe claro no comentário que ele é buffer de
  digitação, não fonte de verdade do filtro.
- Preservar os 32 testes de renderização. Adicione asserção para digitação
  incremental não empilhar histórico.

Rode `npm run build`, reporte e pare antes da Tarefa 1.

---

## Tarefa 1 — `/produto/:slug`

Aqui vive o elemento assinatura do projeto. Vale mais cuidado que qualquer
outra tela.

### Fonte de dados

Só `src/mocks/`. Não criar nem alterar produto. Não editar `src/types/index.ts`.

### Entregar

1. **`src/lib/produto.ts`** — puras, com testes de mesa:
   - `buscarPorSlug(produtos, slug): Produto | undefined`
   - `produtosDoKit(produtos, kit): Produto[]`
   - `economiaDoKit(produtos, kit): { soma: number; economia: number; percentual: number }`
   - `relacionados(produtos, produto, limite): Produto[]` — mesma categoria,
     exclui o próprio e ordena por número de categorias em comum
   - `nomesDasCategorias(categorias, ids): Categoria[]`

2. **`src/components/FichaCatalografica.tsx`** — o bloco assinatura. Plex Mono,
   moldura fina em `grafite`, rótulos alinhados em coluna: autor, título,
   edição, ano, páginas, idioma, ISBN, CDU, editora. Formato de ficha CIP real,
   não uma tabela de especificações de e-commerce. Marcar como `<dl>` com
   `<dt>`/`<dd>`. Ausente em kits — o componente não é renderizado, e nada de
   moldura vazia.

3. **`src/components/SeletorQuantidade.tsx`** — menos/campo/mais em mono.
   Respeita `estoque` como teto quando não for `null`. Não renderizado para
   e-book (quantidade sempre 1).

4. **`src/paginas/Produto/index.tsx`**:
   - Trilha de navegação (`<nav aria-label="Você está aqui">`): Início →
     Catálogo → categoria principal → título.
   - `<h1>` é o título. Subtítulo em `<p>`, não em heading.
   - Autores linkam para `/catalogo?busca=nome`.
   - Capa grande. Preço vigente em mono, grande; se houver promoção, valor
     cheio riscado em `grafite` e economia em % em `riso`.
   - Selos reaproveitando a lógica da Fatia 2: promoção, últimas unidades
     (1–5), esgotado.
   - Descrição em Source Serif, largura de leitura confortável (~65ch).
   - Tags como links para `/catalogo?tag=slug`.
   - `<FichaCatalografica>` quando existir.
   - **E-book:** lista de formatos disponíveis, aviso de entrega imediata por
     download, sem frete.
   - **Kit:** lista dos títulos que compõem, cada um linkando para sua página,
     e a economia calculada por `economiaDoKit` explicitada em texto.
   - **Físico:** peso e aviso de cálculo de frete no checkout.
   - Botão "Adicionar ao carrinho" em destaque (`azul`). Chama uma prop
     `onAdicionar`; a página passa um no-op com comentário `// Fatia 4`. Não
     invente feedback falso de sucesso. Se `estoque === 0`, o botão fica
     desabilitado com texto "Esgotado" e `aria-disabled`.
   - Seção "Relacionados" reusando `CartaoProduto`. Ocultar se vazia.
   - `document.title` = `título — COMPIA Editora`, via `useEffect`, restaurado
     ao desmontar.

5. **Slug inexistente** — não redirecionar em silêncio. Renderizar na própria
   rota: "Não encontramos este título." + link para `/catalogo`. Mesmo
   princípio da categoria inexistente da Fatia 2: URL ruim falha visivelmente.

### Restrições

- Nenhuma dependência nova.
- `components/` continua burro: recebe props, não lê a URL nem os mocks.
  Quem lê `useParams` e os mocks é a página.
- Sem contexto global. Carrinho é a Fatia 4.
- Responsivo: duas colunas (capa | dados) acima de 1024px, uma coluna abaixo,
  com a capa no topo.
- Toda imagem com `alt` descritivo — título e autor, não "capa do livro".
- Testes de renderização com `renderToStaticMarkup` + `MemoryRouter`, cobrindo
  no mínimo: um físico com promoção (`prod-001`), um físico esgotado
  (`prod-008`), um com estoque 3 (`prod-006`), um e-book com 3 formatos
  (`prod-005`), o kit (`prod-009`) e um slug inexistente.

Ao terminar: `npm run build`, mostre a saída, liste os arquivos criados e pare.
Não comece a Fatia 4.
