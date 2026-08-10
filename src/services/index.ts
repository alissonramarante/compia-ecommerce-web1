import categoriasJson from "@/data/categorias.json";
import clientesJson from "@/data/clientes.json";
import downloadsJson from "@/data/downloads.json";
import fretesJson from "@/data/fretes.json";
import pedidosJson from "@/data/pedidos.json";
import produtosJson from "@/data/produtos.json";
import type {
  Categoria,
  Cliente,
  DownloadItem,
  Frete,
  Pedido,
  Produto,
} from "@/types";

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const PRODUTOS_KEY = "compia:produtos";

function readOverrides(): Produto[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PRODUTOS_KEY);
    return raw ? (JSON.parse(raw) as Produto[]) : null;
  } catch {
    return null;
  }
}

function writeOverrides(produtos: Produto[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRODUTOS_KEY, JSON.stringify(produtos));
}

const baseProdutos = produtosJson as Produto[];

export const productService = {
  async getProducts(): Promise<Produto[]> {
    await delay();
    return readOverrides() ?? baseProdutos;
  },
  async getProduct(id: number): Promise<Produto | undefined> {
    const produtos = await productService.getProducts();
    return produtos.find((p) => p.id === id);
  },
  async saveProduct(produto: Produto): Promise<Produto[]> {
    const produtos = [...(readOverrides() ?? baseProdutos)];
    const index = produtos.findIndex((p) => p.id === produto.id);
    if (index >= 0) produtos[index] = produto;
    else produtos.unshift(produto);
    writeOverrides(produtos);
    return produtos;
  },
  async deleteProduct(id: number): Promise<Produto[]> {
    const produtos = (readOverrides() ?? baseProdutos).filter((p) => p.id !== id);
    writeOverrides(produtos);
    return produtos;
  },
  async resetProducts(): Promise<Produto[]> {
    if (typeof window !== "undefined") window.localStorage.removeItem(PRODUTOS_KEY);
    return baseProdutos;
  },
  nextId(produtos: Produto[]) {
    return produtos.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  },
};

export const categoryService = {
  async getCategories(): Promise<Categoria[]> {
    await delay(60);
    return categoriasJson as Categoria[];
  },
  async getBySlug(slug: string): Promise<Categoria | undefined> {
    const categorias = await categoryService.getCategories();
    return categorias.find((c) => c.slug === slug);
  },
};

export const shippingService = {
  async getShippingTable(): Promise<Frete[]> {
    return fretesJson as Frete[];
  },
  async resolveCep(cep: string): Promise<Frete | undefined> {
    await delay(400);
    const digits = Number(cep.replace(/\D/g, ""));
    if (!digits || cep.replace(/\D/g, "").length !== 8) return undefined;
    const table = await shippingService.getShippingTable();
    return table.find((f) => digits >= f.cepInicio && digits <= f.cepFim);
  },
};

const PEDIDOS_KEY = "compia:pedidos";
const PEDIDOS_STATUS_KEY = "compia:pedidosStatus";

function readStatusOverrides(): Record<string, Pedido["status"]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PEDIDOS_STATUS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Pedido["status"]>) : {};
  } catch {
    return {};
  }
}

function writeStatusOverrides(overrides: Record<string, Pedido["status"]>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PEDIDOS_STATUS_KEY, JSON.stringify(overrides));
}

export const orderService = {
  async getOrders(): Promise<Pedido[]> {
    await delay(80);
    const local = typeof window !== "undefined"
      ? window.localStorage.getItem(PEDIDOS_KEY)
      : null;
    const criados = local ? (JSON.parse(local) as Pedido[]) : [];
    const todos = [...criados, ...(pedidosJson as Pedido[])];

    const statusOverrides = readStatusOverrides();
    if (Object.keys(statusOverrides).length === 0) return todos;

    return todos.map((pedido) =>
      statusOverrides[pedido.id] ? { ...pedido, status: statusOverrides[pedido.id] } : pedido,
    );
  },
  async getOrder(id: string): Promise<Pedido | undefined> {
    const pedidos = await orderService.getOrders();
    return pedidos.find((p) => p.id === id);
  },
  async createOrder(pedido: Pedido): Promise<Pedido> {
    if (typeof window !== "undefined") {
      const local = window.localStorage.getItem(PEDIDOS_KEY);
      const criados = local ? (JSON.parse(local) as Pedido[]) : [];
      window.localStorage.setItem(
        PEDIDOS_KEY,
        JSON.stringify([pedido, ...criados].slice(0, 20)),
      );
    }
    return pedido;
  },
  async updateOrderStatus(id: string, status: Pedido["status"]): Promise<Pedido | undefined> {
    if (typeof window !== "undefined") {
      const local = window.localStorage.getItem(PEDIDOS_KEY);
      const criados = local ? (JSON.parse(local) as Pedido[]) : [];
      const index = criados.findIndex((p) => p.id === id);
      if (index >= 0) {
        criados[index] = { ...criados[index], status };
        window.localStorage.setItem(PEDIDOS_KEY, JSON.stringify(criados));
      }
    }
    const overrides = readStatusOverrides();
    overrides[id] = status;
    writeStatusOverrides(overrides);

    return orderService.getOrder(id);
  },
};

export const customerService = {
  async getCustomers(): Promise<Cliente[]> {
    await delay(60);
    return clientesJson as Cliente[];
  },
};

export const downloadService = {
  async getDownloads(): Promise<DownloadItem[]> {
    await delay(60);
    return downloadsJson as DownloadItem[];
  },
};