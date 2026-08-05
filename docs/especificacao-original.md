# Especificação original do trabalho

Este documento reúne os trechos da especificação original da disciplina que
foram comunicados ao longo do desenvolvimento deste projeto. **Não é o
arquivo do enunciado** (esse nunca foi versionado neste repositório) — é a
transcrição fiel dos requisitos contra os quais o README, o `CLAUDE.md` e o
mapeamento de funcionalidades foram conferidos. Existe para que essa
conferência possa ser repetida por qualquer pessoa, sem depender de memória
de conversa.

Se o enunciado completo (PDF ou documento da disciplina) estiver disponível,
o ideal é substituir este arquivo pelo original, ou anexá-lo ao lado.

## Contexto e stack pedidos

- A especificação pedia uma loja construída em **WordPress + WooCommerce**,
  integrada a serviços reais de pagamento, Correios e e-mail.
- A publicação sugerida era na **Vercel**.

Este projeto substitui essa stack por uma aplicação **React com dados
mocados**, sem backend, por orientação do próprio enunciado do trabalho (ver
`CLAUDE.md` § Escopo e `README.md` § Escopo para o detalhe de cada
substituição).

## Sete funcionalidades principais

1. **Gestão de Catálogo de Produtos** — cadastro/edição/exclusão de produtos
   (físicos, e-books, kits); organização por categorias, tags e filtros;
   imagens, descrições, preços e estoque.
2. **Carrinho e Finalização de Compra** — adição/remoção; cálculo automático
   de frete e impostos; checkout simples e responsivo.
3. **Pagamentos** — gateway; principais bandeiras (Visa, MasterCard, Elo);
   PIX com QR Code e chave aleatória.
4. **Gestão de Pedidos e Clientes** — painel administrativo de
   acompanhamento; notificações automáticas por e-mail; área do cliente com
   histórico.
5. **Distribuição dos Itens Vendidos** — envio (Correios/transportadoras);
   retirada no local; e-book por link de download ou área restrita.
6. **Facilidade de Gerência** — painel amigável com menus claros.
7. **Segurança e Confiabilidade** — controle de acesso por perfis (admin,
   editor, vendedor); registro de logs de atividade.

## Escalabilidade

> Suporte a novos produtos e categorias sem necessidade de programação.

Não é um requisito sobre usuários simultâneos nem sobre backend — é sobre o
catálogo poder crescer (novos produtos, novas categorias) sem que alguém
precise editar código-fonte para isso.
