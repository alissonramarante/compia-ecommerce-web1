# Fatia 8 — Polimento e entrega

Leia CLAUDE.md antes de começar. Última fatia: nada de funcionalidade nova.

Quatro tarefas. Commite depois de cada uma e pare para reportar.

---

## Tarefa 0 — Auditoria estática, sem corrigir nada

Varra o projeto inteiro e produza um **relatório**. Não corrija nesta tarefa —
quero ver a lista antes de decidir prioridade. Se algo for defeito de uma linha
e risco zero, aponte como tal, mas ainda assim não conserte agora.

Verifique e relate, por página:

**Acessibilidade**
- Toda rota tem exatamente um `<h1>` e hierarquia de heading sem salto.
- Toda imagem tem `alt` descritivo; imagem decorativa tem `alt=""`.
- Todo campo tem `<label>` associado, com `id` único por instância.
- Erro de formulário associado ao campo por `aria-describedby`.
- Foco visível em tudo que é interativo; nada com `outline: none` sem
  substituto.
- Ordem de foco segue a ordem visual; nada de `tabIndex` positivo.
- Botão que só tem ícone tem `aria-label`.
- Região que muda sem navegação tem `aria-live` — e não mais de uma disputando
  anúncio na mesma tela.
- Contraste: calcule a razão de cada par de cores em uso a partir dos tokens e
  relate qualquer par abaixo de 4.5:1 para texto normal e 3:1 para texto grande
  e elementos de interface. `riso` sobre `papel` e `ocre` sobre `papel` são os
  suspeitos.

**Responsivo**
- Cada página em 360, 768, 1024 e 1440 por inspeção das classes: o que quebra,
  o que estoura largura, o que fica com alvo de toque menor que ~44px.
- Tabela em tela estreita: admin tem várias. Relate como cada uma se comporta.

**Consistência**
- Todo estado vazio existe e oferece saída.
- Todo texto de status vem de `ROTULO_DE_STATUS`, sem duplicata.
- Microcópia conforme CLAUDE.md: frase capitalizada, voz ativa, botão dizendo o
  que acontece, erro dizendo como resolver.
- Nenhuma cor fora dos tokens; nenhum `rounded` acima de 4px sem comentário.
- Mono só onde a regra permite.

**Higiene**
- `console.log` esquecido, `TODO`, código morto, import não usado.
- `document.title` correto em todas as rotas, não só na de produto.
- Tamanho do bundle e o que mais pesa nele.

---

## Tarefa 1 — Correções

Aplique o que a auditoria achou, na ordem: acessibilidade, responsivo,
consistência, higiene. Sem funcionalidade nova, sem refatoração oportunista.

Se uma correção mudar comportamento observável, separe em commit próprio e diga
qual.

Acrescente teste onde couber — contraste é calculável, `alt` e `label` são
verificáveis no HTML estático, `<h1>` único também.

---

## Tarefa 2 — README.md

Público: quem clona o repositório sem contexto nenhum — inclusive o professor
avaliando. Português do Brasil. Objetivo, sem venda.

Estrutura:

1. **Título e uma linha** dizendo o que é: loja virtual da editora COMPIA,
   frontend em React com dados mocados, projeto da disciplina (UFCG / CEEI /
   UASC).

2. **Escopo** — deixe explícito, no começo, que é **só frontend**: não há
   backend, banco, autenticação real nem gateway de pagamento. A tabela de
   "requisito da spec → como foi simulado" do CLAUDE.md entra aqui, adaptada
   para quem nunca leu o CLAUDE.md.

3. **Pré-requisitos** — Node 18 ou superior e npm, com o comando para conferir
   (`node -v`, `npm -v`) e onde baixar. Git para clonar. Navegador atual.
   Nada além disso: sem PHP, sem MySQL, sem WordPress, ao contrário do que a
   spec original sugeria.

4. **Como executar**

   ```
   git clone <url>
   cd Compia
   npm install
   npm run dev
   ```

   Diga que abre em `http://localhost:5173` e o que fazer se a porta estiver
   ocupada. Liste os scripts: `dev`, `build`, `preview`, `testes`, com uma linha
   cada.

5. **Contas de demonstração** — a parte mais importante para quem for avaliar.
   Tabela com os quatro usuários da equipe, o perfil e o que cada um alcança:

   | E-mail | Perfil | Alcança |
   | --- | --- | --- |
   | `renata@compia.com.br` | admin | tudo: produtos, pedidos, clientes, logs |
   | `gustavo@compia.com.br` | editor | produtos e categorias |
   | `claudia@compia.com.br` | vendedor | pedidos e clientes; produtos só leitura |
   | `otavio@compia.com.br` | vendedor (inativo) | nada — serve para demonstrar conta desativada |

   Diga que **não há senha**: basta o e-mail em `/entrar`, e por quê (não há
   backend; autenticação real está fora do escopo).

   Liste também os três clientes que podem ser assumidos em `/entrar`, com a
   cidade de cada um, explicando que trocar o cliente troca carrinho e histórico
   de pedidos.

6. **Como navegar** — roteiro numerado, do jeito que alguém avaliando faria:

   - Loja: vitrine, `/catalogo` com busca sem acento e filtros na URL, página do
     produto com a ficha catalográfica, o kit e a comparação de preço, um
     esgotado, um e-book.
   - Carrinho e checkout em quatro passos: endereço ou retirada, frete por faixa
     de CEP, pagamento.
   - **Dados de teste para pagamento**, explícitos: qualquer número de cartão
     válido pelo algoritmo de Luhn é aprovado (dê um exemplo utilizável), e
     `4000 0000 0000 0002` é sempre recusado. Validade futura qualquer, CVV de 3
     dígitos (4 para Amex).
   - PIX: o QR é gerado de verdade no navegador, mas o payload é fictício e
     nenhum banco aceita; o botão "Simular pagamento" faz a transição.
   - `/conta`: pedidos, downloads de e-book com cota, dados com CPF mascarado.
   - `/admin`: entre com cada perfil e veja o menu mudar; tente uma URL que o
     perfil não alcança para ver a proteção agir.
   - **Reset de demonstração** em `/entrar`: o que apaga e quando usar. Diga
     para rodar antes de avaliar, porque estoque e cota de download são
     consumidos pelo uso.

7. **Arquitetura** — árvore de pastas comentada, os contextos e o que cada um
   guarda, a tabela de chaves do `localStorage`, e a convenção
   `lib/` puro + `hooks/` casca + `components/` burro + página orquestra.

8. **Testes** — `npm run testes`, quantas suítes e asserções, o que cobrem, por
   que não há jsdom nem framework de teste, e que rodam em clone limpo.

9. **Limitações conhecidas** — a seção do CLAUDE.md, escrita para quem avalia:
   duas abas se sobrescrevem, sem fluxo de devolução, payload PIX fictício,
   frete do `ped-003`, links de download fictícios. Limitação declarada é
   melhor que limitação descoberta.

10. **Publicação** — `npm run build` gera `dist/`, e como servir. A spec sugeria
    Vercel: inclua `vercel.json` com reescrita de todas as rotas para
    `index.html` e explique por quê — sem isso, recarregar `/catalogo` na
    hospedagem dá 404, porque o roteamento é do cliente. É a pegadinha mais
    comum ao publicar SPA.

11. **Créditos e contexto** — disciplina, instituição, e que a especificação
    original pedia WordPress + WooCommerce, substituídos por React com dados
    mocados conforme o enunciado do trabalho.

Deixe marcadores `<!-- captura de tela: ... -->` onde imagens ajudariam. Não
invente caminho de arquivo de imagem que não existe.

---

## Tarefa 3 — Verificação final

- Clone limpo em diretório novo: `npm install && npm run testes && npm run build`.
  Relate a saída real, não por inspeção.
- `dist/` sem vestígio de `testes/`.
- Confira o README seguindo os próprios passos, do clone ao checkout completo,
  e corrija o que não corresponder. Documentação que não foi executada está
  errada em algum ponto.
- Percorra os requisitos da especificação original (as sete funcionalidades
  principais mais escalabilidade) e diga, item por item, onde cada um está
  atendido ou por que ficou fora. Sem inflar: "não implementado" é resposta
  válida e melhor que meia verdade.
- Relate a contagem final: arquivos, linhas, suítes, asserções, tamanho do
  bundle.

Ao terminar cada tarefa: `npm run build` **e** `npm run testes`, liste os
arquivos e pare.
