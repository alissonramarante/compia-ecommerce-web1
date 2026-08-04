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
| `?categoria=slug` | Filtra por uma categoria. Aceita repetição para múltiplas. |
| `?busca=termo` | Termo de busca. |
| `?tipo=fisico\|ebook\|kit` | Filtra por tipo. Aceita repetição. |
| `?ordem=…` | Um dos valores de `OrdenacaoCatalogo`. |

O estado dos filtros vive na URL, não em `useState`. A URL tem que ser
compartilhável e o botão voltar do navegador tem que funcionar.

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
tinta      #101418   texto e fundo escuro
papel      #EEF0EA   fundo (levemente frio, não creme)
azul       #23319E   ações primárias, links
riso       #FF4F7B   acento único: promoção, badge, foco
ocre       #D9A521   alertas e estoque baixo
grafite    #5C6670   texto secundário, bordas
```

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

Uma cor de acento por tela. Animação apenas em hover de card e transição entre
passos do checkout. Respeitar `prefers-reduced-motion`. Foco de teclado sempre
visível (anel `riso`).

## Microcópia

Português do Brasil, voz ativa, frase capitalizada (não Title Case).
O botão diz o que acontece: "Finalizar compra", não "Enviar".
Erro explica e diz como resolver: "CEP não encontrado. Confira os 8 dígitos."
Tela vazia convida: "Seu carrinho está vazio. Ver catálogo."

## Como trabalhar comigo (Claude Code)

- Entregue **uma fatia vertical por vez**, na ordem do roadmap. Não adiante fatias.
- Ao terminar uma fatia: rode `npm run build`, liste os arquivos criados e pare.
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
- Tokens substituem a paleta do Tailwind (ver Direção visual).

## Roadmap

1. ~~Scaffold: Vite + TS + Tailwind + tokens + fontes + layout + rotas vazias~~ ✅
2. Catálogo: grade de produtos, busca, filtros, ordenação
3. Página do produto + ficha catalográfica
4. Carrinho + contexto + persistência
5. Checkout: endereço, frete, PIX e cartão, criação do pedido
6. Área do cliente: pedidos, downloads de e-book
7. Admin: login por perfil, CRUD de produtos, pedidos, logs
8. Polimento: responsivo, estados vazios, acessibilidade, README