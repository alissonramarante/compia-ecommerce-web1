import type { ItemCarrinho, Produto } from '../types';
import { estaDisponivel, precoVigente } from './catalogo';

/**
 * Mecânica do carrinho. Puro sobre `ItemCarrinho[]`: sem React, sem
 * `localStorage`, sem relógio. Persistência fica em `carrinhoArmazenado.ts`.
 *
 * `precoUnitario` é o preço congelado no momento da adição. Quem reconcilia
 * com o preço vigente é a carga inicial, não estas funções.
 */

/**
 * Teto de quantidade para produto sem estoque definido (`estoque === null`)
 * que não seja e-book. Não há estoque a respeitar, então o limite é só de
 * sanidade: segura erro de digitação no campo e mantém o seletor finito.
 * Nenhum mock cai neste caso hoje — e-book é tratado antes.
 */
export const TETO_SEM_ESTOQUE = 20;

/* ------------------------------------------------------------------ */
/* 1. Limites                                                          */
/* ------------------------------------------------------------------ */

/**
 * Quantidade máxima que uma linha pode ter.
 *
 * E-book vem primeiro na ordem de decisão: o arquivo é o mesmo, comprar
 * dois não significa nada. Isso não é limite de interface — o reducer
 * também respeita, então adicionar o mesmo e-book duas vezes continua 1.
 *
 * Testes de mesa:
 *   quantidadeMaxima(prod-006 | estoque 3)      → 3
 *   quantidadeMaxima(prod-001 | estoque 42)     → 42
 *   quantidadeMaxima(prod-008 | estoque 0)      → 0
 *   quantidadeMaxima(prod-005 | ebook, null)    → 1
 *   quantidadeMaxima(prod-003 | ebook, null)    → 1
 *   quantidadeMaxima(prod-009 | kit, estoque 12)→ 12
 */
export function quantidadeMaxima(produto: Produto): number {
  if (produto.tipo === 'ebook') return 1;
  if (produto.estoque === null) return TETO_SEM_ESTOQUE;

  return produto.estoque;
}

/** Mantém a quantidade entre 1 e o teto, sempre inteira. */
function limitar(quantidade: number, maximo: number): number {
  if (!Number.isFinite(quantidade)) return 1;

  return Math.max(1, Math.min(Math.floor(quantidade), maximo));
}

/* ------------------------------------------------------------------ */
/* 2. Mutações                                                         */
/* ------------------------------------------------------------------ */

/**
 * Adiciona, ou soma na linha que já existe em vez de duplicar.
 *
 * Produto esgotado não entra: a lista volta intacta, sem erro. Quem impede
 * o clique é a interface; aqui é a última linha de defesa.
 *
 * Testes de mesa:
 *   adicionar prod-001 x1 num carrinho vazio     → 1 linha, quantidade 1
 *   adicionar prod-001 x1 duas vezes             → 1 linha, quantidade 2
 *   adicionar prod-006 (estoque 3) x5            → quantidade 3
 *   adicionar prod-006 x2 e depois x2            → quantidade 3
 *   adicionar prod-005 (e-book) x1 duas vezes    → quantidade 1
 *   adicionar prod-005 (e-book) x3               → quantidade 1
 *   adicionar prod-008 (esgotado)                → carrinho inalterado
 *   adicionar prod-001 x0                        → quantidade 1
 *   precoUnitario congela o preço vigente        → 15900, não 18900
 */
export function adicionarItem(
  itens: ItemCarrinho[],
  produto: Produto,
  quantidade: number,
): ItemCarrinho[] {
  if (!estaDisponivel(produto)) return itens;

  const maximo = quantidadeMaxima(produto);
  if (maximo < 1) return itens;

  const existente = itens.find((item) => item.produtoId === produto.id);

  if (existente !== undefined) {
    return itens.map((item) =>
      item.produtoId === produto.id
        ? { ...item, quantidade: limitar(item.quantidade + quantidade, maximo) }
        : item,
    );
  }

  return [
    ...itens,
    {
      produtoId: produto.id,
      quantidade: limitar(quantidade, maximo),
      precoUnitario: precoVigente(produto),
    },
  ];
}

/**
 * Testes de mesa:
 *   remover produto que está no carrinho → linha some
 *   remover produto que não está         → lista inalterada
 */
export function removerItem(itens: ItemCarrinho[], produtoId: string): ItemCarrinho[] {
  return itens.filter((item) => item.produtoId !== produtoId);
}

/**
 * Define a quantidade de uma linha. Zero ou menos remove.
 *
 * Não recebe o produto, então não conhece o teto: quem chama já passa o
 * valor limitado por `quantidadeMaxima`. O reducer faz isso.
 *
 * Testes de mesa:
 *   alterar para 3   → quantidade 3
 *   alterar para 0   → linha removida
 *   alterar para -2  → linha removida
 *   alterar para 2.7 → quantidade 2
 *   produto ausente  → lista inalterada
 */
export function alterarQuantidade(
  itens: ItemCarrinho[],
  produtoId: string,
  quantidade: number,
): ItemCarrinho[] {
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    return removerItem(itens, produtoId);
  }

  return itens.map((item) =>
    item.produtoId === produtoId
      ? { ...item, quantidade: Math.floor(quantidade) }
      : item,
  );
}

/* ------------------------------------------------------------------ */
/* 3. Totais                                                           */
/* ------------------------------------------------------------------ */

/**
 * Soma em centavos, sempre pelo preço congelado na linha.
 *
 * Testes de mesa:
 *   []                                   → 0
 *   [prod-001 x2 a 15900]                → 31800
 *   [prod-001 x2 a 15900, prod-007 x1 a 3900] → 35700
 */
export function calcularSubtotal(itens: ItemCarrinho[]): number {
  return itens.reduce((total, item) => total + item.quantidade * item.precoUnitario, 0);
}

/** Total de uma linha, em centavos. */
export function totalDaLinha(item: ItemCarrinho): number {
  return item.quantidade * item.precoUnitario;
}

/**
 * Soma das quantidades — é o número que vai no cabeçalho, não o número de
 * linhas.
 *
 * Testes de mesa:
 *   []                            → 0
 *   [x2]                          → 2
 *   [x2, x1]                      → 3
 */
export function contarItens(itens: ItemCarrinho[]): number {
  return itens.reduce((total, item) => total + item.quantidade, 0);
}

/**
 * Peso em gramas, para o frete da Fatia 5. E-book pesa 0 e some da conta
 * sozinho. Item cujo produto não existe mais contribui 0 em vez de quebrar.
 *
 * Testes de mesa:
 *   []                                  → 0
 *   [prod-001 x2 | 980 g]               → 1960
 *   [prod-001 x1, prod-005 x1 | ebook]  → 980
 *   [prod-005 x1]                       → 0
 *   [produto fantasma x3]               → 0
 */
export function pesoTotal(itens: ItemCarrinho[], produtos: Produto[]): number {
  return itens.reduce((total, item) => {
    const produto = produtos.find((candidato) => candidato.id === item.produtoId);
    if (produto === undefined) return total;

    return total + produto.peso * item.quantidade;
  }, 0);
}

/* ------------------------------------------------------------------ */
/* 4. Junção com o catálogo                                            */
/* ------------------------------------------------------------------ */

export interface LinhaDoCarrinho {
  item: ItemCarrinho;
  produto: Produto;
}

/**
 * Casa cada linha com o produto correspondente, para a página não precisar
 * procurar dentro do JSX. Linha órfã é descartada — depois da reconciliação
 * isso não deveria acontecer, e se acontecer é melhor sumir que renderizar
 * um item sem nome.
 *
 * Testes de mesa:
 *   [prod-001 x1]        → 1 linha, produto.id 'prod-001'
 *   [fantasma x1]        → []
 */
export function linhasDoCarrinho(
  itens: ItemCarrinho[],
  produtos: Produto[],
): LinhaDoCarrinho[] {
  return itens
    .map((item) => {
      const produto = produtos.find((candidato) => candidato.id === item.produtoId);
      return produto === undefined ? undefined : { item, produto };
    })
    .filter((linha): linha is LinhaDoCarrinho => linha !== undefined);
}

/* ------------------------------------------------------------------ */
/* 5. Texto                                                            */
/* ------------------------------------------------------------------ */

/**
 * Anúncio de leitor de tela ao adicionar. Texto pronto vem da lib, não do
 * JSX — mesma regra dos avisos de reconciliação.
 *
 * Testes de mesa:
 *   mensagemDeAdicao('Matemática Essencial para IA', 1) → 'Matemática Essencial para IA adicionado ao carrinho. 1 item.'
 *   mensagemDeAdicao('Kit Trilha de IA Aplicada', 3)    → 'Kit Trilha de IA Aplicada adicionado ao carrinho. 3 itens.'
 */
export function mensagemDeAdicao(titulo: string, quantidadeTotal: number): string {
  const unidade = quantidadeTotal === 1 ? 'item' : 'itens';

  return `${titulo} adicionado ao carrinho. ${quantidadeTotal} ${unidade}.`;
}
