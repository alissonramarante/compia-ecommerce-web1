# Auditoria estática — Fatia 8, Tarefa 0

Varredura do projeto inteiro contra as regras de `CLAUDE.md`. **Relatório apenas — nada foi corrigido aqui.** Achados citam `arquivo:linha`. A Tarefa 1 aplica correções na ordem: acessibilidade → responsivo → consistência → higiene.

Metodologia: leitura de todas as 16 páginas (`src/paginas/**/index.tsx`) e dos componentes de casca/compartilhados que elas montam, grep dirigido para os padrões cross-cutting (cores fora dos tokens, `console.log`, `document.title`, `ROTULO_DE_STATUS`, `rounded-[9999px]`), e cálculo exato (fórmula WCAG de luminância relativa) da razão de contraste de cada par de tokens. Sem browser disponível — responsivo e foco visível foram avaliados por leitura das classes Tailwind, não por captura de tela.

---

## 1. Contraste (calculado, fórmula WCAG)

Razão de contraste de cada par de tokens (`tailwind.config.js:11-24`). Mínimos: **4.5:1** texto normal, **3:1** texto grande (≥18px, ou ≥14px bold) e componentes de interface.

| Par | Razão | Texto normal (4.5:1) | Texto grande / UI (3:1) |
| --- | --- | --- | --- |
| tinta / papel | 16.11:1 | ✅ | ✅ |
| tinta / white | 18.50:1 | ✅ | ✅ |
| azul / papel | 9.12:1 | ✅ | ✅ |
| azul / white | 10.48:1 | ✅ | ✅ |
| grafite / papel | 5.09:1 | ✅ | ✅ |
| grafite / white | 5.85:1 | ✅ | ✅ |
| tinta / riso | 5.86:1 | ✅ | ✅ |
| tinta / ocre | 8.24:1 | ✅ | ✅ |
| **riso / papel** | **2.75:1** | ❌ | ❌ |
| **riso / white** | **3.15:1** | ❌ | ✅ (só texto grande/UI) |
| **ocre / papel** | **1.95:1** | ❌ | ❌ |
| **ocre / white** | **2.24:1** | ❌ | ❌ |
| riso / ocre | 1.41:1 | ❌ | ❌ (não coexistem como texto sobre texto na prática) |
| azul / riso | 3.32:1 | ❌ | ✅ |

**Achado real, sistêmico:** `riso` e `ocre` como **cor de texto** sobre `papel`/`white` nunca atingem 4.5:1, e `ocre` nem atinge 3:1. Isso afeta todo lugar que usa `text-ocre`/`text-riso` para texto pequeno (a maioria dos casos abaixo é `text-xs`/`text-sm`, ou seja, "texto normal", exigindo 4.5:1):

| Uso | Arquivo:linha | Tamanho | Razão | Resultado |
| --- | --- | --- | --- | --- |
| Erro de campo (padrão do checkout) | `PassoEndereco.tsx:62` | text-xs | 1.95:1 (ocre/papel) | ❌ |
| Erro de campo (cartão) | `PassoPagamento.tsx:74` | text-xs | 1.95:1 | ❌ |
| Erro de campo (produto admin) | `ProdutoFormulario/index.tsx:23` (`CLASSE_ERRO`) | text-xs | 1.95:1 | ❌ |
| Erro de mudança de status | `admin/PedidoDetalhe/index.tsx:360` | text-sm | ~1.95–2.24:1 | ❌ |
| Erro de acesso da equipe | `Entrar/index.tsx:181` | text-sm | 1.95:1 | ❌ |
| Aviso de recompra | `Conta/index.tsx:119` | text-sm | 1.95:1 | ❌ |
| Estoque baixo (cartão de produto) | `CartaoProduto.tsx:106` | text-[11px] | ~1.95:1 | ❌ |
| Estoque baixo (página do produto) | `Produto/index.tsx:243` | text-xs | 1.95:1 | ❌ |
| Estoque baixo (tabela admin) | `admin/Produtos/index.tsx:286` (`text-ocre` no `<span>`) | text-xs | 1.95–2.24:1 | ❌ |
| Status "aguardando_pagamento" | `LinhaDePedido.tsx:20` | — | depende do fundo do badge | verificar no fix |
| Percentual de desconto | `Produto/index.tsx:228` (`text-riso`) | text-sm font-medium | 2.75:1 (sobre papel) | ❌ (mas 3.15 se o fundo real for `white`, ainda falha 4.5) |

**Não é um problema:** todo uso de `riso`/`ocre` como **fundo** com texto `tinta` por cima (`bg-riso text-tinta`, `bg-ocre text-tinta` — selos "−16%", "Últimas unidades", "Esgotado") passa com folga (5.86:1 e 8.24:1).

**Recomendação para a Tarefa 1:** trocar `text-ocre`/`text-riso` como cor de texto direto sobre `papel`/`white` por `tinta` com um marcador visual em `ocre`/`riso` ao lado (borda, ponto, ícone) — o padrão que o próprio projeto já usa em outros lugares (ex.: borda `border-l-2 border-ocre` nos avisos de confirmação) — em vez de depender da cor do texto para transmitir o estado.

---

## 2. Acessibilidade, por página

Casca compartilhada (`Layout`/`Cabecalho`/`Rodape`, `LayoutAdmin`/`AreaProtegida`): sem `h1` próprio (correto, cada página tem o seu); botões de ícone (hambúrguer, carrinho, sair) têm `aria-label`; nenhum `outline-none` solto — `src/index.css:14-24` implementa `:focus-visible` com anel `riso` de 2px e restringe a supressão do outline a `:focus:not(:focus-visible)` (ou seja, nunca some no teclado). Nenhum `tabIndex` positivo em todo o projeto; o único `tabIndex={-1}` (`Checkout/index.tsx:285`, foco programático no título do passo) é o uso correto e documentado.

| Página | h1 único / hierarquia | `alt` | label/id | aria-describedby | aria-live |
| --- | --- | --- | --- | --- | --- |
| `/` Inicio | ✅ | — | — | — | — |
| `/catalogo` | ✅ | ✅ | ✅ | — | ✅ (1 região) |
| `/produto/:slug` | ✅ (inclusive 404) | ✅ | ✅ | — | ✅ (1, sr-only) |
| `/carrinho` | ✅ | ✅ | ✅ (`quantidade-${produto.id}` por linha, sem colisão) | — | ✅ (1) |
| `/checkout` | ✅ (inclusive vazio) | — | ✅ | ✅ | ⚠️ **ver abaixo** |
| `/pedido/:numero` | ✅ (inclusive 404) | — | ✅ (`payload-pix`) | — | ❌ **nenhuma região existe** |
| `/conta` | ✅ | — | — | — | ✅ (1, só na aba "pedidos") |
| `/entrar` | ✅ | — | ✅ | ✅ | ✅ (1) |
| `/admin` Painel | ✅ | — | — | — | — |
| `/admin/produtos` | ✅ | ✅ (`alt=""` decorativo, correto) | ✅ | — | ✅ (2, mutuamente exclusivas) |
| `/admin/produtos/novo`, `/:id` | ✅ (inclusive 404) | — | ✅ (sem colisão de id em nenhum `.map`) | ⚠️ **3 grupos sem vínculo** | ⚠️ **até 10 regiões, ver abaixo** |
| `/admin/pedidos` | ✅ | — | ✅ | — | ✅ (1) |
| `/admin/pedidos/:numero` | ✅ (inclusive 404) | — | ✅ | ✅ | ⚠️ **`role="alert"` + `aria-live` redundante, ver abaixo** |
| `/admin/clientes` | ✅ | — | — | — | — |
| `/admin/logs` | ✅ | — | ✅ | — | ✅ (1) |

### Achados que precisam de correção

1. **`/checkout` — anúncios concorrentes.** `Checkout/index.tsx:156-166` (`avancar`) marca todos os campos do passo como tocados numa única atualização (6 campos de endereço, ou 4 de cartão). Cada campo tem sua própria região `aria-live="polite"` (`PassoEndereco.tsx:62`, `PassoPagamento.tsx:73`). Ao tentar avançar com o passo inválido, várias regiões mudam de texto no mesmo instante — leitor de tela não consegue falar tudo de forma coerente. Afeta o fluxo de compra, a página de maior tráfego do site.

2. **`/admin/produtos/novo` e `/:id` — o mesmo problema, agravado.** `ProdutoFormulario/index.tsx:142-146` (`aoSubmeter`) toca todos os ~9 campos rastreados de uma vez. Até 10 parágrafos `aria-live="polite"` (título, autores, slug, preço, preço-promo, formatos, estoque, peso, itensDoKit, ficha) mais um `role="alert"` novo (linha 610-614) podem mudar juntos no primeiro submit de um formulário vazio. É o achado mais severo do app.

3. **`/admin/produtos/novo` — três grupos de erro sem vínculo `aria-describedby`.** `formatos` (parágrafo de erro em `ProdutoFormulario/index.tsx:412`, sem `id`, fieldset em `:393` sem `aria-describedby`), `itensDoKit` (erro em `:488`, sem `id`; fieldset em `:462`), `ficha` (erro em `:590`, sem `id`; nenhum dos 7 campos `ficha-*` referencia). Quem usa leitor de tela não recebe explicação do que está inválido nesses três grupos.

4. **`/pedido/:numero` não tem nenhuma região `aria-live`.** "Simular pagamento" e "Gerar nova cobrança" (`CobrancaPix.tsx:46,117`) trocam a seção inteira de pagamento sem anunciar a mudança.

5. **`role="alert"` + `aria-live="polite"` redundante/contraditório** em `admin/PedidoDetalhe/index.tsx:360` (`role="alert"` já é implicitamente assertivo) e no padrão do banner de erro do `ProdutoFormulario`. Escolher um dos dois, não os dois juntos.

Confirmado como correto e não listado individualmente acima: heading (h1 único + hierarquia) em todas as 16 páginas incluindo os ramos de "não encontrado"; todo `<img>` com `alt` descritivo real (`CartaoProduto.tsx:43-54` monta "Capa de {título}, de {autores}") ou `alt=""` corretamente decorativo (`admin/Produtos/index.tsx:249`, já existe texto adjacente no link); nenhuma colisão de `id` em campo renderizado dentro de `.map()` em nenhuma página (todas interpolam a chave do item).

---

## 3. Responsivo (360 / 768 / 1024 / 1440)

Sem `screens` customizado em `tailwind.config.js` — breakpoints padrão do Tailwind (`sm=640, md=768, lg=1024, xl=1280`).

### Achado principal: `/carrinho` sem rede de segurança horizontal

`Carrinho/index.tsx:73` — `<table className="w-full border-collapse">`, **sem** `overflow-x-auto` nem `min-w-[...]`, diferente de **todas** as tabelas do admin. Colunas não encolhíveis somadas (capa `w-12`=48px + `SeletorQuantidade` ≈136px de largura mínima + total + botão remover + paddings) já passam de ~300px antes mesmo da coluna de título ganhar espaço — em 360px (≈328px de área útil após `px-4`) isso deve estourar largura ou espremer o título sem nenhuma forma de rolar até o conteúdo cortado. É a única tabela do projeto sem o padrão de rolagem contida.

### Tabelas do admin em 360px — como cada uma se comporta

Todas as quatro seguem o mesmo padrão correto (`overflow-x-auto` envolvendo `<table min-w-[...]>`), então **nenhuma quebra nem estoura a página** — mas nenhuma sinaliza visualmente que é rolável (sem sombra de borda, sem dica de "arraste"), o que lê como tabela cortada/quebrada até alguém arrastar por acidente:

| Rota | `min-w` | Colunas | Nota |
| --- | --- | --- | --- |
| `/admin/produtos` | `40rem` (640px) | 7 (+ ações) | Botões de ação (editar/excluir) dentro da área rolada também são pequenos para toque (ver abaixo). |
| `/admin/pedidos` | `36rem` (576px) | 5 | A mais estreita das quatro; sem botão de ícone nas linhas. |
| `/admin/clientes` | `44rem` (704px) | 6 | A mais larga; linha inteira também é clicável (`cursor-pointer`, funciona por toque mesmo sem `:hover`). |
| `/admin/logs` | `44rem` (704px) | 5 (com "Descrição" livre) | Empata como a mais larga; coluna de descrição pode alongar bastante a rolagem. |

### Alvos de toque abaixo de ~44px

- Botão remover do carrinho — `Carrinho/index.tsx:164-167`, `p-2` + ícone 16px ≈ **32×32px**.
- Editar/excluir na tabela de produtos do admin — `admin/Produtos/index.tsx:314-324`, `p-1` + ícone 16px ≈ **24×24px** (dentro de uma área já rolada horizontalmente).
- Ícones do cabeçalho (hambúrguer, carrinho) — `Cabecalho.tsx:78,101` — ≈28–38px.
- Linhas de checkbox/radio (filtros do catálogo, formulário de produto) usam `<label>` de linha inteira com `py-1` — altura efetiva ≈24-28px, mas por serem `<label>` de largura total o risco é menor que um botão de ícone isolado.

### Demais observações

- Nenhum `grid-cols-N` sem variante responsiva foi encontrado — todo grid no projeto (catálogo, relacionados, cartões do painel) começa em 1–2 colunas e escala via `sm:`/`lg:`. O item "grade de 4 colunas ilegível em 360px" do roteiro da auditoria **não se aplica** a este código.
- `Produto/index.tsx:145` e `Carrinho/index.tsx:71` colapsam para coluna única em `lg` (1024px), não em `md` (768px) — significa que tablets em retrato também recebem o layout empilhado. Não é bug, mas é uma escolha conservadora que vale mencionar.
- `CobrancaPix.tsx:72` empilha QR (tamanho fixo 168px) e área de copiar/colar abaixo de `sm` — seguro, o QR nunca disputa espaço com o texto em 360px.

---

## 4. Consistência

### Tokens e `rounded`
Limpo: grep completo por classes de cor fora dos seis tokens (`bg-gray-*`, `text-slate-*`, `border-red-*` etc.) não encontrou nenhuma ocorrência — o build já barra isso silenciosamente, e ninguém escreveu uma classe inexistente até agora.

`rounded-[9999px]` (círculo arbitrário, exige comentário explicando o motivo por `CLAUDE.md`): 9 ocorrências, **3 sem o comentário exigido**, todas do lado admin, enquanto os equivalentes da loja têm o comentário:
- `admin/ProdutoFormulario/index.tsx:272` (radio de tipo) — comparar com `PassoEndereco.tsx:93`, `Entrar/index.tsx:109`, que têm.
- `admin/PedidoDetalhe/index.tsx:274` (marcador da linha do tempo) — comparar com `Pedido/index.tsx:252`, que tem.
- `admin/PedidoDetalhe/index.tsx:314` (radio de novo status) — mesmo padrão sem comentário.

### `riso`: "um por tela"
**Violação confirmada:** `Produto/index.tsx` mostra o mesmo desconto **duas vezes** na mesma tela — selo de capa `bg-riso` (linha 169) e texto de preço `text-riso` (linha 228) — para qualquer produto não-kit com `precoPromocional` (existe em `prod-001`, `prod-005`, `prod-009` nos mocks). O comentário do próprio código (linhas 225-227) só justifica mostrar o percentual, não reconcilia com a regra de "um por tela".

**Caso ambíguo, provável violação também:** `Catalogo/index.tsx:153` renderiza `CartaoProduto` em grade; cada cartão com desconto mostra seu próprio selo `bg-riso` (`CartaoProduto.tsx:63-67`) de forma independente. Com ≥2 produtos com desconto visíveis ao mesmo tempo (alcançável com os mocks atuais, sem filtro), a tela do catálogo mostra múltiplos selos riso simultâneos. O único texto do projeto sobre a regra é "no máximo um por cartão" (`CartaoProduto.tsx:57`) — nunca resolve o caso "por tela" explicitamente. Fica registrado como pendência de interpretação para a Tarefa 1 decidir (a regra é sobre a tela do produto, que tem o discurso comparativo do kit, ou é literal sobre qualquer tela?).

### `font-mono` fora do padrão
`Painel/index.tsx` é o exemplo mais limpo da regra (rótulo em `font-display`, número em `font-mono`, linhas 17/20). Contra essa referência, três "olho" de seção em prosa decorativa usam mono onde deveriam usar `font-display`:
- `Inicio/index.tsx:7-9` — `"Editora técnica · Campina Grande, PB"`.
- `Conta/index.tsx:77-79` — `"Minha conta"`.
- `admin/ProdutoFormulario/index.tsx:176-178` — `"Editar produto" / "Novo produto"`.

E um caso de inconsistência semântica: `admin/PedidoDetalhe/index.tsx:253` mostra `pedido.pagamento.status` (valor cru: `'aprovado'|'recusado'|'pendente'|'estornado'`) em `font-mono uppercase`, enquanto o status do **pedido** sempre passa por `ROTULO_DE_STATUS` num badge `font-display` (`Pedido/index.tsx:95`, `PedidoDetalhe/index.tsx:147`, `LinhaDePedido.tsx:52`). Não é dado tabular/catalográfico — é um valor de estado categórico, mesma classe do status do pedido, e devia seguir o mesmo tratamento visual (ainda que hoje calhe de já ser uma palavra em português legível).

### `ROTULO_DE_STATUS`
**Aprovado, sem ressalva.** Grep exaustivo confirma que todo lugar que renderiza `StatusPedido` passa por `ROTULO_DE_STATUS[...]` — nenhuma interpolação crua de `{pedido.status}` existe em `src/`.

### Microcópia
Conforme a regra na quase totalidade dos casos: frase capitalizada, voz ativa, botões dizem o que fazem ("Finalizar compra", "Confirmar e pagar", "Salvar alterações", "Confirmar mudança"), erros dizem como resolver (`lib/checkout.ts:78,291`). Único ponto fora do padrão: **`Checkout/index.tsx:411` — botão do passo intermediário diz só "Continuar"**, sem objeto, diferente do próprio botão do passo final ao lado ("Confirmar e pagar") e de todo o resto do app.

### Estados vazios
Loja: todos com saída (`SemResultados.tsx` + "Limpar filtros"; carrinho vazio + "Ver catálogo"; checkout vazio + "Ver catálogo"; downloads vazios + "Ver e-books").

**Admin não segue a mesma regra** — três listas mostram frase seca sem ação, apesar de todas terem filtro ativo como causa provável:
- `admin/Produtos/index.tsx:202` — "Nenhum produto encontrado com estes filtros." sem botão de limpar.
- `admin/Pedidos/index.tsx:136` — mesma frase, mesmo problema (a página já tem `limparFiltroDeCliente`, só não está ligada a este estado).
- `admin/Logs/index.tsx:102` — idem.

(`admin/Clientes` não filtra nada, então não precisa de estado vazio — não é lacuna.)

---

## 5. Higiene

- **`console.log`/`warn`/`error`/`debug`:** zero ocorrências em `src/`. Limpo.
- **`TODO`/`FIXME`/`XXX`/`HACK`:** zero ocorrências reais (grep pegou só falsos positivos do português "todos/todas" em nomes como `TODOS_OS_STATUS`, `TODOS_OS_CAMPOS`). Limpo.
- **Código morto:** nenhum componente de `src/components/` ou módulo de `src/lib/` órfão — todos importados em pelo menos um ponto real. Nenhum bloco de JSX/código comentado encontrado.
- **`document.title`:** só 2 das 17 rotas definem (`Produto/index.tsx:49`, `Pedido/index.tsx:30`). As outras 15 — incluindo as 8 do admin inteiro — ficam com o título estático do `index.html`. A aba do navegador não distingue carrinho de checkout de conta de qualquer tela do painel.
- **Bundle:** build limpo, sem erro. `dist/assets/index-*.js` = 357.03 kB (104 kB gzip), `*.css` = 19.48 kB (4.63 kB gzip), chunk único (sem code-splitting entre loja e `/admin/**` — quem visita só a loja baixa o painel inteiro também). `lucide-react` confirmado tree-shakeable (só os ~13 ícones realmente importados aparecem no bundle final, verificado por busca de nomes de ícones não usados). react+react-dom são o piso de tamanho mais provável; não há alavanca óbvia de higiene aqui além de considerar `React.lazy` para o `/admin/**` no futuro (fora do escopo desta fatia, que é só polimento sem funcionalidade nova).

---

## Prioridade sugerida para a Tarefa 1

Seguindo a ordem pedida (acessibilidade → responsivo → consistência → higiene), os itens de maior impacto:

1. Anúncios concorrentes no checkout e no formulário de produto (marcar campos tocados em lote dispara várias regiões `aria-live` juntas) — **acessibilidade**, maior risco.
2. Contraste de `text-ocre`/`text-riso` sobre `papel`/`white` em todo lugar que usa essas cores como texto — **acessibilidade**, sistêmico, um só padrão de correção resolve ~10 pontos.
3. Três grupos de erro sem `aria-describedby` no formulário de produto — **acessibilidade**.
4. `aria-live` ausente em `/pedido/:numero` — **acessibilidade**.
5. Tabela do carrinho sem `overflow-x-auto`/`min-w` — **responsivo**, único caso divergente do padrão já usado em 4 outras tabelas.
6. Alvos de toque abaixo de 44px nos botões de ícone (carrinho, admin produtos) — **responsivo**.
7. Selo `riso` duplicado na página do produto — **consistência**, regra de "um por tela" já existe, só não foi seguida aqui.
8. Estados vazios do admin sem saída — **consistência**, mesmo padrão já implementado na loja, só falta replicar.
9. `rounded-[9999px]` sem comentário (3 casos) e `font-mono` em texto decorativo (3-4 casos) — **consistência**, correções pontuais de uma linha.
10. `document.title` ausente em 15 rotas — **higiene**, mecânica já existe em 2 páginas, só falta replicar o padrão.

Nenhum achado desta auditoria envolve mudar comportamento de negócio — são todos ajustes de apresentação/acessibilidade, exceto onde a Tarefa 1 decidir que a correção do estado vazio do admin (adicionar botão "limpar filtros") conta como comportamento observável novo o suficiente para commit separado, conforme a regra da fatia.
