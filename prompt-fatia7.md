# Fatia 7 — Painel administrativo

Leia CLAUDE.md antes de começar.

**Esta fatia é diferente das anteriores.** As Fatias 1 a 6 só acrescentaram.
Esta precisa trocar a fonte de `produtos` — hoje importada direto dos mocks em
catálogo, produto, carrinho, checkout e conta — por um contexto mutável. É a
primeira vez que se mexe em código que já funciona, com risco real de regressão
nas 800+ asserções.

Por isso são **cinco tarefas**, e a refatoração está isolada na primeira.
Commite depois de cada uma e pare para reportar. Não junte tarefas.

Não editar `src/types/index.ts`: `Usuario`, `PerfilUsuario`, `LogAtividade` e
`AcaoLog` já existem.

---

## Tarefa 0 — `ProdutosContext`, sem mudar comportamento

**Critério de sucesso: a suíte inteira continua verde sem que nenhuma asserção
precise ser reescrita.** Se uma asserção quebrar, o comportamento mudou e a
tarefa está errada — não ajuste o teste, corrija o código.

- `src/contexts/ProdutosContext.tsx` + `src/hooks/useProdutos.ts`, semeado com
  `produtos` dos mocks, persistido em `compia:produtos:v1`, mesmas regras
  defensivas das outras chaves: `try/catch`, validação de forma, semente só
  enquanto não houver nada gravado.
- Toda página que importava `produtos` dos mocks passa a usar `useProdutos()`.
  `components/` continua burro — quem chama o hook é página.
- `src/lib/produtosArmazenados.ts` para a persistência, seguindo o par
  mecânica/persistência já estabelecido.
- Provider entra em `App.tsx` **acima** de `CarrinhoProvider`: a reconciliação
  do carrinho depende do catálogo. Uma linha no arnês.
- Expor: `produtos`, `produtoPorId`, `produtoPorSlug`, `salvarProduto`,
  `excluirProduto`, `baixarEstoque(itens)`.

### Decremento de estoque

Ao criar pedido no checkout, `baixarEstoque` reduz o estoque dos itens com
estoque numérico. E-book (`null`) não muda. Estoque nunca fica negativo.

Isto **é** mudança de comportamento, e é a única autorizada nesta tarefa —
mantenha em commit separado do resto, para o rollback ser cirúrgico. Consequência
esperada e desejável: com um carrinho aberto, mudar preço ou estoque passa a
disparar os avisos de reconciliação da Fatia 4. O trabalho já está feito; só
confirme que funciona.

Cancelar pedido **não** devolve estoque nesta tarefa. Decida na Tarefa 3 e
documente.

---

## Tarefa 1 — Perfis e proteção de rota

- `src/lib/permissoes.ts`, puro: `podeVer(perfil, area)` e
  `podeEditar(perfil, area)`, com as áreas `produtos`, `pedidos`, `clientes` e
  `logs`. A matriz está em CLAUDE.md: `admin` tudo; `editor` produtos e
  categorias, sem pedidos nem logs; `vendedor` pedidos e clientes, produtos
  somente leitura.
- `src/components/AreaProtegida.tsx` envolvendo as rotas de `/admin`.
- Sem `usuarioCorrente`: tela pedindo acesso da equipe, com link para `/entrar`.
  **Não** redirecione em silêncio.
- Com usuário sem permissão: "Você não tem acesso a esta área", dizendo qual
  perfil está em uso e quais áreas ele alcança. Mesmo princípio das URLs ruins
  das fatias anteriores — falhar visivelmente.
- O menu do painel esconde o que o perfil não pode ver, **e** a rota protege
  mesmo assim. Esconder não é proteger.
- Layout próprio do admin: barra lateral ou superior com as áreas permitidas,
  nome e perfil do usuário, e saída. Visualmente parente da loja, não uma
  segunda identidade — mesmos tokens, mesma tipografia.

---

## Tarefa 2 — CRUD de produtos

- `/admin/produtos`: tabela com capa pequena, título, tipo, preço vigente em
  mono, estoque com destaque `ocre` em 1–5 e rótulo para esgotado, e destaque.
  Busca e filtro por tipo reaproveitando `lib/catalogo.ts` — não reescreva
  filtragem.
- Criar e editar no mesmo formulário, em `/admin/produtos/novo` e
  `/admin/produtos/:id`. Rota, não modal: URL compartilhável e voltar funciona.
- Campos conforme o tipo. Físico exige peso e estoque numérico; e-book exige
  formatos e força `estoque: null` e `peso: 0`; kit exige `itensDoKit` com no
  mínimo dois produtos e não tem ficha catalográfica.
- Ficha catalográfica opcional, com todos os campos ou nenhum — meia ficha não
  entra.
- `slug` gerado do título, editável, **único**. Colisão bloqueia o salvamento
  com mensagem.
- Preço em reais no formulário, centavos no domínio. Conversão na fronteira,
  como no filtro de preço.
- Validação em `src/lib/produtoFormulario.ts`, pura, devolvendo erros por campo.
  Nada de validação dentro do JSX.
- Excluir pede confirmação nomeando o produto — é destrutivo e sem desfazer.
  Produto que compõe um kit não pode ser excluído: diga qual kit o referencia.
- `vendedor` vê a tabela sem os botões de ação e sem acesso ao formulário.

---

## Tarefa 3 — Pedidos

- `/admin/pedidos`: lista com número, cliente, data, status, total. Filtro por
  status e busca por número ou nome de cliente, com estado na URL.
- Detalhe em `/admin/pedidos/:numero`: itens, entrega, pagamento, histórico
  completo.
- Mudar status a partir das transições **válidas** para o estado atual. Não
  ofereça um `<select>` com todos os sete: `entregue` não volta para
  `aguardando_pagamento`. Máquina de transições em `src/lib/statusPedido.ts`,
  pura e testada.
- Cada mudança grava `EventoPedido` com observação opcional.
- `enviado` pede código de rastreio; grave em `Entrega.codigoRastreio`.
- **Decida e documente:** cancelar pedido devolve estoque? Recomendo que sim
  para pedido não enviado, e não para enviado. Implemente sua escolha e explique
  no relatório.
- Notificação por e-mail simulada: ao mudar status, exibir confirmação de que o
  e-mail foi enviado ao cliente e registrar em log. Sem `setTimeout` fingindo
  latência.
- `editor` não acessa esta área.

---

## Tarefa 4 — Logs

- `src/contexts/LogsContext.tsx`, semeado com os `logs` dos mocks, persistido em
  `compia:logs:v1`.
- Registrar de fato, com o `usuarioCorrente` como autor: `login`, `logout`,
  `produto_criado`, `produto_editado`, `produto_excluido`,
  `pedido_status_alterado`, `email_enviado`. Use os valores de `AcaoLog` que já
  existem; se faltar ação, relate em vez de inventar tipo.
- Chamada de registro nas páginas, não dentro de função pura — `lib/` não tem
  efeito colateral.
- `/admin/logs`: mais recente primeiro, com autor, ação legível, entidade,
  descrição e data. Filtro por ação e por usuário, estado na URL.
- Só `admin` acessa.
- `/admin` (painel): números do que existe — produtos, esgotados, pedidos por
  status, receita dos pedidos pagos. Tudo derivado, nada hardcodado, e cada
  cartão respeitando as permissões do perfil.

---

## Restrições (todas as tarefas)

- Nenhuma dependência nova.
- Sem `fetch`, sem backend, sem latência fingida.
- Função pura nunca chama `new Date()` — `agora` por parâmetro.
- `components/` burro; hook só em página.
- Toda escrita passa por reducer puro; persistência em `useEffect`.
- Formulário navegável por teclado, erro em `aria-live`, `<label>` com `id`
  único por instância (o defeito da Fatia 4 não pode voltar).
- Testes por tarefa, preservando as anteriores. A Tarefa 0 é a única em que
  **nenhuma** asserção existente pode mudar.

Ao terminar cada tarefa: `npm run build` **e** `npm run testes`, liste os
arquivos e pare.
