# Fatia 2 — Catálogo

Leia CLAUDE.md antes de começar. Ele foi atualizado: parâmetros de `/catalogo`,
token `azul`, regras de `borderRadius` e monoespaçada, e uma seção
"Decisões já tomadas". Respeite-a.

Duas tarefas, nesta ordem. Commite entre elas.

---

## Tarefa 0 — Renomear o token `indigo` para `azul`

Puramente mecânico, sem mudança visual. O nome `indigo` colide com a paleta
nativa do Tailwind, e uma classe inexistente como `bg-indigo-500` falharia em
silêncio.

- `tailwind.config.js`: a chave de cor passa a ser `azul`, mesmo hex `#23319E`.
- Substituir todas as ocorrências de classe (`bg-indigo`, `text-indigo`,
  `border-indigo`, `ring-indigo`, `hover:bg-indigo`, etc.) por `azul`.
- Conferir também `index.css` e qualquer variável CSS.
- Rodar `npm run build` e depois `grep -ri indigo src/ tailwind.config.js` —
  tem que voltar vazio.

Pare e reporte antes da Tarefa 1.

---

## Tarefa 1 — Catálogo

Implemente `/catalogo` e a página `/produto/:slug` **não** entra nesta fatia
(é a Fatia 3). Cards linkam para ela mesmo assim.

### Fonte de dados

Só `src/mocks/`. Não criar, renomear nem inventar produto, categoria ou tag.
Não editar `src/types/index.ts`.

### Estado na URL

Toda a leitura de filtro vem de `useSearchParams`, conforme a tabela de
CLAUDE.md. Nenhum filtro em `useState`. Recarregar a página tem que preservar
tudo; voltar no navegador tem que desfazer um filtro por vez.

### Entregar

1. **`src/lib/catalogo.ts`** — funções puras, testáveis, sem React:
   - `filtrarProdutos(produtos, filtros): Produto[]`
   - `ordenarProdutos(produtos, ordenacao): Produto[]`
   - `precoVigente(produto): number` — respeita `precoPromocional`
   - `estaDisponivel(produto): boolean` — `estoque === null` é sempre disponível
   - `lerFiltrosDaUrl(searchParams): FiltrosCatalogo`
   - `contarPorCategoria(produtos): Record<string, number>`
   - Busca cobre título, subtítulo e autores. Sem acento e sem caixa:
     normalizar com `NFD` e remover diacríticos, para "matematica" achar
     "Matemática".

2. **`src/components/CartaoProduto.tsx`** — capa, título, subtítulo, autores,
   preço vigente em mono. Se houver `precoPromocional`, o preço cheio aparece
   riscado em `grafite` e um selo `riso` mostra a economia em %.
   Selo `ocre` "Últimas unidades" quando `estoque` for 1–5.
   Estado esgotado (`estoque === 0`): capa dessaturada, selo "Esgotado",
   card ainda clicável. Não usar `opacity` no card inteiro — mata o contraste
   do texto.
   E-book e kit recebem etiqueta discreta de tipo.

3. **`src/components/FiltrosCatalogo.tsx`** — categoria (checkbox), tipo
   (checkbox), faixa de preço (dois campos), "somente em estoque", e ordenação
   num `<select>`. Botão "Limpar filtros" só aparece quando algo está ativo.
   Abaixo de 768px, os filtros ficam num painel recolhível fechado por padrão,
   com o número de filtros ativos no botão que o abre.

4. **`src/paginas/Catalogo/index.tsx`** — orquestra: lê a URL, aplica as
   funções de `lib/catalogo.ts`, renderiza a grade. Contagem de resultados em
   mono ("8 títulos"). Grade de 1 / 2 / 3 colunas conforme a largura.

5. **Visão de categorias** (`?visao=categorias`) — grade das 6 categorias com
   nome, descrição e contagem de títulos. Clicar leva a `?categoria=slug`.
   É o destino do item "Categorias" do cabeçalho, que já existe.

6. **Estado vazio** — quando o filtro não retorna nada: explicar e oferecer
   saída, não só "Nenhum resultado". Ex.: "Nenhum título com esses filtros.
   Limpar filtros" — com o botão funcionando.

### Restrições

- Nenhuma dependência nova.
- Sem `fetch`, sem backend, sem contexto global nesta fatia — o catálogo é
  derivado da URL + mocks, não precisa de estado compartilhado.
- Componentes de `components/` continuam burros: recebem props, não leem a URL.
  Quem lê a URL é a página.
- O botão do carrinho no cabeçalho continua com contador zerado. Adicionar ao
  carrinho é a Fatia 4.
- Toda imagem com `alt` descritivo. Filtros com `<label>` associado.
  Mudança de filtro anuncia a nova contagem via `aria-live="polite"`.

Ao terminar: `npm run build`, mostre a saída, liste os arquivos criados e pare.
Não comece a Fatia 3.
