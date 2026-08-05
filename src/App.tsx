import { Route, Routes } from 'react-router-dom';

import CarrinhoProvider from './contexts/CarrinhoContext';
import PedidosProvider from './contexts/PedidosContext';
import ProdutosProvider from './contexts/ProdutosContext';
import LogsProvider from './contexts/LogsContext';
import SessaoProvider from './contexts/SessaoContext';
import Layout from './components/Layout';
import LayoutAdmin from './components/LayoutAdmin';
import AreaProtegida from './components/AreaProtegida';
import Inicio from './paginas/Inicio';
import Catalogo from './paginas/Catalogo';
import Produto from './paginas/Produto';
import Carrinho from './paginas/Carrinho';
import Checkout from './paginas/Checkout';
import Pedido from './paginas/Pedido';
import Conta from './paginas/Conta';
import Entrar from './paginas/Entrar';
import NaoEncontrada from './paginas/NaoEncontrada';
import AdminPainel from './paginas/admin/Painel';
import AdminProdutos from './paginas/admin/Produtos';
import AdminProdutoFormulario from './paginas/admin/ProdutoFormulario';
import AdminPedidos from './paginas/admin/Pedidos';
import AdminPedidoDetalhe from './paginas/admin/PedidoDetalhe';
import AdminClientes from './paginas/admin/Clientes';
import AdminLogs from './paginas/admin/Logs';

/**
 * Duas cascas: a da loja (`Layout`) e a do painel (`LayoutAdmin`), parentes
 * mas não a mesma identidade visual. `AreaProtegida` guarda cada rota de
 * `/admin` — a de fora exige só estar logado como equipe (o próprio painel
 * não tem área específica), as de dentro exigem a área correspondente.
 */
function App() {
  return (
    <SessaoProvider>
      <LogsProvider>
        <PedidosProvider>
          <ProdutosProvider>
            <CarrinhoProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Inicio />} />
                  <Route path="/catalogo" element={<Catalogo />} />
                  <Route path="/produto/:slug" element={<Produto />} />
                  <Route path="/carrinho" element={<Carrinho />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/pedido/:numero" element={<Pedido />} />
                  <Route path="/conta" element={<Conta />} />
                  <Route path="/entrar" element={<Entrar />} />

                  <Route path="*" element={<NaoEncontrada />} />
                </Route>

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
              </Routes>
            </CarrinhoProvider>
          </ProdutosProvider>
        </PedidosProvider>
      </LogsProvider>
    </SessaoProvider>
  );
}

export default App;
