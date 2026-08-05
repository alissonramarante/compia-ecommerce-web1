import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import SessaoProvider from '../src/contexts/SessaoContext.tsx';
import PedidosProvider from '../src/contexts/PedidosContext.tsx';
import ProdutosProvider from '../src/contexts/ProdutosContext.tsx';
import CarrinhoProvider from '../src/contexts/CarrinhoContext.tsx';
import Layout from '../src/components/Layout.tsx';
import LayoutAdmin from '../src/components/LayoutAdmin.tsx';
import AreaProtegida from '../src/components/AreaProtegida.tsx';

import Inicio from '../src/paginas/Inicio/index.tsx';
import Catalogo from '../src/paginas/Catalogo/index.tsx';
import Produto from '../src/paginas/Produto/index.tsx';
import Carrinho from '../src/paginas/Carrinho/index.tsx';
import Checkout from '../src/paginas/Checkout/index.tsx';
import Pedido from '../src/paginas/Pedido/index.tsx';
import Conta from '../src/paginas/Conta/index.tsx';
import Entrar from '../src/paginas/Entrar/index.tsx';
import NaoEncontrada from '../src/paginas/NaoEncontrada/index.tsx';
import AdminPainel from '../src/paginas/admin/Painel/index.tsx';
import AdminProdutos from '../src/paginas/admin/Produtos/index.tsx';
import AdminProdutoFormulario from '../src/paginas/admin/ProdutoFormulario/index.tsx';
import AdminPedidos from '../src/paginas/admin/Pedidos/index.tsx';
import AdminPedidoDetalhe from '../src/paginas/admin/PedidoDetalhe/index.tsx';
import AdminClientes from '../src/paginas/admin/Clientes/index.tsx';
import AdminLogs from '../src/paginas/admin/Logs/index.tsx';

/**
 * Arnês único de renderização das suítes.
 *
 * Espelha a árvore de App.tsx. Provider novo entra aqui, numa linha, em vez
 * de virar varredura em cada suíte — foi o que aconteceu quando o
 * CarrinhoProvider passou a depender de useSessao e 62 asserções quebraram
 * de uma vez.
 */

interface Opcoes {
  /** Envolve no Layout (cabeçalho e rodapé). Fora dele por padrão. */
  comLayout?: boolean;
  /** Semeia `compia:sessao:v1`. */
  sessao?: { clienteId: string; usuarioId: string | null } | null;
  /** Semeia o carrinho de cada cliente: `{ 'cli-001': [itens] }`. */
  carrinhos?: Record<string, unknown[]>;
  /** Semeia `compia:pedidos:v1`. Ausente usa a semente dos mocks. */
  pedidos?: unknown[];
  /** Semeia `compia:produtos:v1`. Ausente usa a semente dos mocks. */
  produtos?: unknown[];
  /** Grava chaves cruas, para testar conteúdo corrompido ou o formato antigo. */
  bruto?: Record<string, string>;
  /** `localStorage` inexistente (SSR). */
  semArmazenamento?: boolean;
  /** `localStorage` que lança em toda operação (modo privado do Safari). */
  armazenamentoHostil?: boolean;
}

function prepararArmazenamento(opcoes: Opcoes): void {
  if (opcoes.semArmazenamento === true) {
    delete (globalThis as Record<string, unknown>).localStorage;
    return;
  }

  if (opcoes.armazenamentoHostil === true) {
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('modo privado');
      },
      removeItem: () => {
        throw new Error('modo privado');
      },
    };
    return;
  }

  const dados: Record<string, string> = {};

  if (opcoes.sessao !== undefined && opcoes.sessao !== null) {
    dados['compia:sessao:v1'] = JSON.stringify(opcoes.sessao);
  }

  for (const [clienteId, itens] of Object.entries(opcoes.carrinhos ?? {})) {
    dados[`compia:carrinho:v1:${clienteId}`] = JSON.stringify(itens);
  }

  if (opcoes.pedidos !== undefined) {
    dados['compia:pedidos:v1'] = JSON.stringify(opcoes.pedidos);
  }

  if (opcoes.produtos !== undefined) {
    dados['compia:produtos:v1'] = JSON.stringify(opcoes.produtos);
  }

  Object.assign(dados, opcoes.bruto ?? {});

  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (chave: string) => (chave in dados ? dados[chave] : null),
    setItem: (chave: string, valor: string) => {
      dados[chave] = String(valor);
    },
    removeItem: (chave: string) => {
      delete dados[chave];
    },
    dados,
  };
}

function Rotas() {
  return (
    <>
      <Route path="/" element={<Inicio />} />
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/produto/:slug" element={<Produto />} />
      <Route path="/carrinho" element={<Carrinho />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/pedido/:numero" element={<Pedido />} />
      <Route path="/conta" element={<Conta />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="*" element={<NaoEncontrada />} />
    </>
  );
}

/** Casca própria do painel, sempre presente — independe de `comLayout`. */
function RotasAdmin() {
  return (
    <Route
      path="/admin"
      element={
        <AreaProtegida>
          <LayoutAdmin />
        </AreaProtegida>
      }
    >
      <Route index element={<AdminPainel />} />
      <Route
        path="produtos"
        element={
          <AreaProtegida area="produtos">
            <AdminProdutos />
          </AreaProtegida>
        }
      />
      <Route
        path="produtos/novo"
        element={
          <AreaProtegida area="produtos" exigeEdicao>
            <AdminProdutoFormulario />
          </AreaProtegida>
        }
      />
      <Route
        path="produtos/:id"
        element={
          <AreaProtegida area="produtos" exigeEdicao>
            <AdminProdutoFormulario />
          </AreaProtegida>
        }
      />
      <Route
        path="pedidos"
        element={
          <AreaProtegida area="pedidos">
            <AdminPedidos />
          </AreaProtegida>
        }
      />
      <Route
        path="pedidos/:numero"
        element={
          <AreaProtegida area="pedidos">
            <AdminPedidoDetalhe />
          </AreaProtegida>
        }
      />
      <Route
        path="clientes"
        element={
          <AreaProtegida area="clientes">
            <AdminClientes />
          </AreaProtegida>
        }
      />
      <Route
        path="logs"
        element={
          <AreaProtegida area="logs">
            <AdminLogs />
          </AreaProtegida>
        }
      />
    </Route>
  );
}

export function renderizarComProvedores(rota: string, opcoes: Opcoes = {}): string {
  prepararArmazenamento(opcoes);

  const rotas = opcoes.comLayout === true ? (
    <Route element={<Layout />}>{Rotas().props.children}</Route>
  ) : (
    Rotas().props.children
  );

  return renderToStaticMarkup(
    <SessaoProvider>
      <PedidosProvider>
        <ProdutosProvider>
          <CarrinhoProvider>
            <MemoryRouter initialEntries={[rota]}>
              <Routes>
                {rotas}
                {RotasAdmin()}
              </Routes>
            </MemoryRouter>
          </CarrinhoProvider>
        </ProdutosProvider>
      </PedidosProvider>
    </SessaoProvider>,
  );
}

/** Devolve o mapa cru do armazenamento após a última renderização. */
export function armazenamentoAtual(): Record<string, string> {
  const alvo = (globalThis as Record<string, unknown>).localStorage as
    | { dados?: Record<string, string> }
    | undefined;

  return alvo?.dados ?? {};
}
