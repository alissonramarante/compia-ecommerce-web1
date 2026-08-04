import { Route, Routes } from 'react-router-dom';

import CarrinhoProvider from './contexts/CarrinhoContext';
import PedidosProvider from './contexts/PedidosContext';
import SessaoProvider from './contexts/SessaoContext';
import Layout from './components/Layout';
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
import AdminPedidos from './paginas/admin/Pedidos';
import AdminLogs from './paginas/admin/Logs';

/**
 * Todas as rotas da especificação, todas dentro da mesma casca.
 * A proteção por perfil do /admin entra na Fatia 7.
 */
function App() {
  return (
    <SessaoProvider>
      <PedidosProvider>
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

              <Route path="/admin" element={<AdminPainel />} />
              <Route path="/admin/produtos" element={<AdminProdutos />} />
              <Route path="/admin/pedidos" element={<AdminPedidos />} />
              <Route path="/admin/logs" element={<AdminLogs />} />

              <Route path="*" element={<NaoEncontrada />} />
            </Route>
          </Routes>
        </CarrinhoProvider>
      </PedidosProvider>
    </SessaoProvider>
  );
}

export default App;
