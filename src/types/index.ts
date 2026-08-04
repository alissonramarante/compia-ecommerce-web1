// Fonte única de verdade do domínio da loja COMPIA.
// Regra geral: todo valor monetário é INTEIRO EM CENTAVOS.
// Toda data é string ISO 8601.

/* ------------------------------------------------------------------ */
/* 1. Catálogo                                                         */
/* ------------------------------------------------------------------ */

export type TipoProduto = 'fisico' | 'ebook' | 'kit';

export interface Categoria {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
}

export interface Produto {
  id: string;
  slug: string;
  titulo: string;
  subtitulo?: string;
  autores: string[];
  tipo: TipoProduto;
  categoriaIds: string[];
  tags: string[];
  /** Preço de venda em centavos. */
  preco: number;
  /** Se definido, é o preço vigente e `preco` vira o valor "de". */
  precoPromocional?: number;
  /** `null` = ilimitado (e-books). */
  estoque: number | null;
  /** Gramas. Usado no cálculo de frete. E-books têm peso 0. */
  peso: number;
  imagens: string[];
  descricao: string;
  /** Bloco da ficha catalográfica. Ausente em kits. */
  ficha?: FichaCatalografica;
  /** Somente para `tipo === 'kit'`: ids dos produtos que compõem o kit. */
  itensDoKit?: string[];
  /** Somente para `tipo === 'ebook'`. */
  formatos?: FormatoEbook[];
  destaque: boolean;
  criadoEm: string;
}

export type FormatoEbook = 'pdf' | 'epub' | 'mobi';

export interface FichaCatalografica {
  isbn: string;
  edicao: string;
  ano: number;
  paginas: number;
  idioma: string;
  cdu: string;
  editora: string;
}

/* ------------------------------------------------------------------ */
/* 2. Clientes                                                         */
/* ------------------------------------------------------------------ */

export interface Endereco {
  id: string;
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  principal: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  enderecos: Endereco[];
  criadoEm: string;
}

/* ------------------------------------------------------------------ */
/* 3. Carrinho                                                         */
/* ------------------------------------------------------------------ */

export interface ItemCarrinho {
  produtoId: string;
  quantidade: number;
  /** Preço unitário congelado no momento em que entrou no carrinho. */
  precoUnitario: number;
}

/* ------------------------------------------------------------------ */
/* 4. Frete e entrega                                                  */
/* ------------------------------------------------------------------ */

export type ModalidadeEntrega = 'envio' | 'retirada' | 'download';

export interface FaixaFrete {
  /** Prefixo de CEP que define a faixa, ex.: '58'. */
  prefixo: string;
  regiao: string;
  /** Centavos por kg. */
  custoPorKg: number;
  /** Centavos cobrados independente do peso. */
  taxaFixa: number;
  prazoDiasUteis: number;
}

export interface OpcaoFrete {
  id: string;
  nome: string;
  transportadora: string;
  valor: number;
  prazoDiasUteis: number;
}

export interface Entrega {
  modalidade: ModalidadeEntrega;
  /** Ausente em retirada e download. */
  endereco?: Endereco;
  /** Ausente quando o valor é zero. */
  opcaoFrete?: OpcaoFrete;
  valor: number;
  codigoRastreio?: string;
}

/* ------------------------------------------------------------------ */
/* 5. Pagamento                                                        */
/* ------------------------------------------------------------------ */

export type MetodoPagamento = 'pix' | 'cartao';

export type BandeiraCartao = 'visa' | 'mastercard' | 'elo' | 'amex' | 'desconhecida';

export type StatusPagamento = 'pendente' | 'aprovado' | 'recusado' | 'estornado';

export interface Pagamento {
  metodo: MetodoPagamento;
  status: StatusPagamento;
  valor: number;
  /** Cartão: parcelas. PIX sempre 1. */
  parcelas: number;
  /** Cartão: só os 4 últimos dígitos são guardados. */
  ultimosDigitos?: string;
  bandeira?: BandeiraCartao;
  /** PIX: payload fake usado para gerar o QR Code. */
  payloadPix?: string;
  chavePix?: string;
  /** PIX: expiração da cobrança. */
  expiraEm?: string;
  pagoEm?: string;
}

/* ------------------------------------------------------------------ */
/* 6. Pedidos                                                          */
/* ------------------------------------------------------------------ */

export type StatusPedido =
  | 'aguardando_pagamento'
  | 'pago'
  | 'em_separacao'
  | 'enviado'
  | 'pronto_para_retirada'
  | 'entregue'
  | 'cancelado';

export interface ItemPedido {
  produtoId: string;
  /** Título congelado: o produto pode ser renomeado depois. */
  titulo: string;
  tipo: TipoProduto;
  quantidade: number;
  precoUnitario: number;
}

export interface EventoPedido {
  status: StatusPedido;
  em: string;
  observacao?: string;
}

export interface DownloadEbook {
  produtoId: string;
  formato: FormatoEbook;
  url: string;
  /** Simulado: limite de downloads restantes. */
  downloadsRestantes: number;
}

export interface Pedido {
  id: string;
  /** Legível pelo cliente, ex.: 'CPA-2026-0142'. */
  numero: string;
  clienteId: string;
  itens: ItemPedido[];
  subtotal: number;
  entrega: Entrega;
  total: number;
  pagamento: Pagamento;
  status: StatusPedido;
  historico: EventoPedido[];
  /** Preenchido quando o pedido tem e-book e está pago. */
  downloads?: DownloadEbook[];
  criadoEm: string;
  atualizadoEm: string;
}

/* ------------------------------------------------------------------ */
/* 7. Acesso administrativo                                            */
/* ------------------------------------------------------------------ */

export type PerfilUsuario = 'admin' | 'editor' | 'vendedor';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  ultimoAcesso?: string;
}

export type AcaoLog =
  | 'login'
  | 'logout'
  | 'produto_criado'
  | 'produto_editado'
  | 'produto_excluido'
  | 'pedido_status_alterado'
  | 'email_enviado';

export interface LogAtividade {
  id: string;
  usuarioId: string;
  acao: AcaoLog;
  /** Ex.: 'produto', 'pedido'. */
  entidade: string;
  entidadeId?: string;
  descricao: string;
  em: string;
}

/* ------------------------------------------------------------------ */
/* 8. Filtros do catálogo                                              */
/* ------------------------------------------------------------------ */

export type OrdenacaoCatalogo =
  | 'relevancia'
  | 'menor_preco'
  | 'maior_preco'
  | 'lancamentos'
  | 'titulo_az';

export interface FiltrosCatalogo {
  busca: string;
  categoriaIds: string[];
  tipos: TipoProduto[];
  tags: string[];
  precoMin?: number;
  precoMax?: number;
  somenteEmEstoque: boolean;
  ordenacao: OrdenacaoCatalogo;
}
