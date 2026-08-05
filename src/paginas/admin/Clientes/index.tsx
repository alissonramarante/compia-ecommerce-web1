import { Link, useNavigate } from 'react-router-dom';

import { clientes } from '../../../mocks';
import { cidadeDoCliente } from '../../../lib/sessao';
import { resumoDoCliente } from '../../../lib/pedido';
import { formatarMoeda, mascararCpf } from '../../../lib/formatadores';
import { usePedidos } from '../../../hooks/usePedidos';

const CLASSE_CABECALHO =
  'py-3 pr-4 text-left font-display text-xs font-bold uppercase tracking-widest text-grafite';

/**
 * Acompanhamento de clientes, somente leitura — a spec pede isso, não
 * cadastro. Tudo derivado do `PedidosContext` e dos mocks de cliente, nada
 * hardcodado: quantidade de pedidos e total gasto vêm de `resumoDoCliente`.
 *
 * Linha inteira é um link para os pedidos daquele cliente, com o filtro já
 * aplicado — não um formulário de edição.
 */
function Clientes() {
  const { pedidos } = usePedidos();
  const navegar = useNavigate();

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Clientes</h1>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse">
          <caption className="sr-only">Lista de clientes</caption>
          <thead>
            <tr className="border-b border-grafite/30">
              <th scope="col" className={CLASSE_CABECALHO}>
                Nome
              </th>
              <th scope="col" className={CLASSE_CABECALHO}>
                Contato
              </th>
              <th scope="col" className={CLASSE_CABECALHO}>
                CPF
              </th>
              <th scope="col" className={CLASSE_CABECALHO}>
                Cidade
              </th>
              <th scope="col" className={`${CLASSE_CABECALHO} text-right`}>
                Pedidos
              </th>
              <th scope="col" className={`${CLASSE_CABECALHO} text-right`}>
                Total gasto
              </th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => {
              const resumo = resumoDoCliente(cliente.id, pedidos);

              const destino = `/admin/pedidos?cliente=${cliente.id}`;

              return (
                <tr
                  key={cliente.id}
                  onClick={() => navegar(destino)}
                  className="cursor-pointer border-b border-grafite/20 hover:bg-white"
                >
                  <td className="py-3 pr-4">
                    <Link
                      to={destino}
                      className="font-display text-sm font-semibold text-tinta hover:text-azul"
                    >
                      {cliente.nome}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-sm text-grafite">
                    <p>{cliente.email}</p>
                    <p className="font-mono text-xs">{cliente.telefone}</p>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-grafite">{mascararCpf(cliente.cpf)}</td>
                  <td className="py-3 pr-4 text-sm text-tinta">{cidadeDoCliente(cliente)}</td>
                  <td className="py-3 pl-4 text-right font-mono text-sm text-tinta">
                    {resumo.quantidadeDePedidos}
                  </td>
                  <td className="py-3 pl-4 text-right font-mono text-sm font-medium text-tinta">
                    {formatarMoeda(resumo.totalGasto)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Clientes;
