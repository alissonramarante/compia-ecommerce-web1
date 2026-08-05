import { contarEsgotados } from '../../../lib/catalogo';
import { ROTULO_DE_STATUS, contarPedidosPorStatus, receitaDosPedidosPagos } from '../../../lib/pedido';
import { formatarMoeda } from '../../../lib/formatadores';
import { podeVer } from '../../../lib/permissoes';
import { useProdutos } from '../../../hooks/useProdutos';
import { usePedidos } from '../../../hooks/usePedidos';
import { useSessao } from '../../../hooks/useSessao';

interface CartaoProps {
  titulo: string;
  valor: string | number;
}

function Cartao({ titulo, valor }: CartaoProps) {
  return (
    <div className="border border-grafite/30 bg-white p-5">
      <p className="font-display text-xs font-bold uppercase tracking-widest text-grafite">
        {titulo}
      </p>
      <p className="mt-2 font-mono text-2xl font-medium text-tinta">{valor}</p>
    </div>
  );
}

/**
 * Painel: números do que existe, tudo derivado do `ProdutosContext` e do
 * `PedidosContext` — nada hardcodado. Cada grupo de cartão respeita a
 * permissão do perfil: `editor` só vê produtos; `vendedor` vê produtos e
 * pedidos, mas não os números que dependeriam de `logs`.
 */
function Painel() {
  const { usuarioCorrente } = useSessao();
  const { produtos } = useProdutos();
  const { pedidos } = usePedidos();

  // AreaProtegida (sem `area`) já garante usuarioCorrente não-nulo aqui.
  if (usuarioCorrente === null) return null;

  const perfil = usuarioCorrente.perfil;
  const veProdutos = podeVer(perfil, 'produtos');
  const vePedidos = podeVer(perfil, 'pedidos');
  const porStatus = contarPedidosPorStatus(pedidos);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Painel</h1>
      <p className="mt-2 text-sm text-grafite">
        Bem-vindo, {usuarioCorrente.nome}.
      </p>

      {!veProdutos && !vePedidos && (
        <p className="mt-6 text-sm leading-relaxed text-grafite">
          Seu perfil não tem números para mostrar aqui — veja as áreas do menu ao lado.
        </p>
      )}

      {veProdutos && (
        <section aria-labelledby="titulo-produtos" className="mt-8">
          <h2 id="titulo-produtos" className="font-display text-sm font-bold uppercase tracking-widest text-tinta">
            Produtos
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Cartao titulo="Total" valor={produtos.length} />
            <Cartao titulo="Esgotados" valor={contarEsgotados(produtos)} />
          </div>
        </section>
      )}

      {vePedidos && (
        <section aria-labelledby="titulo-pedidos" className="mt-8">
          <h2 id="titulo-pedidos" className="font-display text-sm font-bold uppercase tracking-widest text-tinta">
            Pedidos por status
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(porStatus).map(([status, quantidade]) => (
              <Cartao
                key={status}
                titulo={ROTULO_DE_STATUS[status as keyof typeof porStatus]}
                valor={quantidade}
              />
            ))}
          </div>

          <h2 className="mt-8 font-display text-sm font-bold uppercase tracking-widest text-tinta">
            Receita
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Cartao titulo="Pedidos pagos" valor={formatarMoeda(receitaDosPedidosPagos(pedidos))} />
          </div>
        </section>
      )}
    </div>
  );
}

export default Painel;
