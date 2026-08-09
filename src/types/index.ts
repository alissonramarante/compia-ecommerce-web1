export type Formato = "fisico" | "digital";

export interface Produto {
  id: number;
  titulo: string;
  descricao: string;
  valor: number;
  estoque: number;
  imagens: string[];
  paginas: number;
  formato: Formato;
  sku: string;
  categoria: string;
  tags: string[];
  avaliacao: number;
  avaliacoes: number;
  destaque?: boolean;
  tendencia?: boolean;
}

export interface Categoria {
  id: number;
  nome: string;
  slug: string;
  descricao: string;
  imagem: string;
}

export interface Frete {
  estado: string;
  nome: string;
  valorFrete: number;
  cepInicio: number;
  cepFim: number;
}

export interface PedidoItem {
  produtoId: number;
  titulo: string;
  quantidade: number;
  valor: number;
  formato: Formato;
}

export type PedidoStatus =
  | "pendente"
  | "aprovado"
  | "preparacao"
  | "enviado"
  | "entregue";

export interface Pedido {
  id: string;
  data: string;
  cliente: string;
  email?: string;
  status: PedidoStatus;
  pagamento: "pix" | "cartao";
  total: number;
  itens: PedidoItem[];
  endereco?: string;
  parcelas?: number;
}

export interface Cliente {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  cidade: string;
  estado: string;
  perfil: string;
  pedidos: number;
  totalGasto: number;
  criadoEm: string;
}

export interface DownloadItem {
  id: number;
  produtoId: number;
  titulo: string;
  formatoArquivo: string;
  tamanho: string;
  liberadoEm: string;
  pedido: string;
  url: string;
}

export type Disponibilidade = "disponivel" | "baixo" | "esgotado";