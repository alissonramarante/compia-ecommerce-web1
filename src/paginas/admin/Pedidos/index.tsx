import { Link, useSearchParams } from 'react-router-dom';

import type { StatusPedido } from '../../../types';
import { clientes } from '../../../mocks';
import { ROTULO_DE_STATUS, filtrarPedidos } from '../../../lib/pedido';
import { formatarData, formatarMoeda } from '../../../lib/formatadores';
import { usePedidos } from '../../../hooks/usePedidos';

const STATUSES = Object.keys(ROTULO_DE_STATUS) as StatusPedido[];

const CLASSE_CABECALHO =
  'py-3 pr-4 text-left font-display text-xs font-bold uppercase tracking-widest text-grafite';

function ehStatusValido(valor: string): valor is StatusPedido {
  return (STATUSES as string[]).includes(valor);
}

function nomeDoCliente(clienteId: string): string {
  return clientes.find((cliente) => cliente.id === clienteId)?.nome ?? 'Cliente removido';
}

/**
 * Lista de pedidos do painel. Filtro por status e busca por número ou nome
 * do cliente, estado na URL — igual em espírito ao catálogo, sem reusar o
 * componente de busca dele: a microcópia ("título ou autor") não se aplica
 * a pedido.
 *
 * `?cliente=` filtra por um cliente exato — é o link de `/admin/clientes`.
 */
function Pedidos() {
  const [parametros, setParametros] = useSearchParams();
  const { pedidos } = usePedidos();

  const statusBruto = parametros.get('status') ?? '';
  const filtros = {
    busca: parametros.get('busca') ?? '',
    status: ehStatusValido(statusBruto) ? statusBruto : ('' as const),
    clienteId: parametros.get('cliente') ?? '',
  };

  const resultado = filtrarPedidos(pedidos, clientes, filtros);
  const clienteFiltrado = filtros.clienteId !== '' ? clientes.find((c) => c.id === filtros.clienteId) : undefined;

  /* `replace: true` em toda tecla: sem debounce (o volume de pedidos no
     painel não pede a mesma engenharia da busca da vitrine), mas cada
     caractere sobrescreve a mesma entrada de histórico em vez de empilhar
     uma nova — digitar uma palavra não devia custar uma palavra de cliques
     no botão voltar.
     Não apara o valor aqui: o campo é controlado direto pela URL, e cortar
     um espaço à direita a cada tecla apagaria o espaço entre "larissa" e
     "fontes" bem no meio de digitar o segundo nome. `normalizarTexto` já
     apara na comparação — aparar aqui também é só para não persistir
     `?busca=` vazio no lugar de removê-lo. */
  const definirBusca = (valor: string) => {
    const proximos = new URLSearchParams(parametros);
    if (valor.trim() === '') proximos.delete('busca');
    else proximos.set('busca', valor);
    setParametros(proximos, { replace: true });
  };

  const definirStatus = (status: string) => {
    const proximos = new URLSearchParams(parametros);
    if (status === '') proximos.delete('status');
    else proximos.set('status', status);
    setParametros(proximos);
  };

  const limparFiltroDeCliente = () => {
    const proximos = new URLSearchParams(parametros);
    proximos.delete('cliente');
    setParametros(proximos);
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Pedidos</h1>

      {clienteFiltrado !== undefined && (
        <p className="mt-4 flex flex-wrap items-center gap-3 border-l-2 border-azul bg-white px-4 py-3 text-sm leading-relaxed text-tinta">
          Mostrando pedidos de <span className="font-semibold">{clienteFiltrado.nome}</span>.
          <button
            type="button"
            onClick={limparFiltroDeCliente}
            className="font-display text-xs font-semibold uppercase tracking-wide text-azul hover:underline"
          >
            Ver todos os pedidos
          </button>
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          role="search"
          onSubmit={(evento) => evento.preventDefault()}
          className="flex sm:max-w-xs sm:flex-1"
        >
          <label htmlFor="busca-pedidos" className="sr-only">
            Buscar por número ou nome do cliente
          </label>
          <input
            id="busca-pedidos"
            type="search"
            value={filtros.busca}
            onChange={(evento) => definirBusca(evento.target.value)}
            placeholder="Buscar por número ou cliente"
            className="w-full border border-grafite/40 bg-white px-3 py-2 text-sm text-tinta placeholder:text-grafite"
          />
        </form>

        <div>
          <label htmlFor="filtro-status" className="sr-only">
            Filtrar por status
          </label>
          <select
            id="filtro-status"
            value={filtros.status}
            onChange={(evento) => definirStatus(evento.target.value)}
            className="border border-grafite/40 bg-white px-3 py-2 text-sm text-tinta"
          >
            <option value="">Todos os status</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {ROTULO_DE_STATUS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p aria-live="polite" className="mt-6 font-mono text-xs uppercase tracking-widest text-grafite">
        {resultado.length} {resultado.length === 1 ? 'pedido' : 'pedidos'}
      </p>

      {resultado.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-grafite">
          Nenhum pedido encontrado com estes filtros.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse">
            <caption className="sr-only">Lista de pedidos</caption>
            <thead>
              <tr className="border-b border-grafite/30">
                <th scope="col" className={CLASSE_CABECALHO}>
                  Número
                </th>
                <th scope="col" className={CLASSE_CABECALHO}>
                  Cliente
                </th>
                <th scope="col" className={CLASSE_CABECALHO}>
                  Data
                </th>
                <th scope="col" className={CLASSE_CABECALHO}>
                  Status
                </th>
                <th scope="col" className={`${CLASSE_CABECALHO} text-right`}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {resultado.map((pedido) => (
                <tr key={pedido.id} className="border-b border-grafite/20">
                  <td className="py-3 pr-4">
                    <Link
                      to={`/admin/pedidos/${pedido.numero}`}
                      className="font-mono text-sm font-medium text-tinta hover:text-azul"
                    >
                      {pedido.numero}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-sm text-tinta">{nomeDoCliente(pedido.clienteId)}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-grafite">
                    {formatarData(pedido.criadoEm)}
                  </td>
                  <td className="py-3 pr-4 text-sm text-tinta">{ROTULO_DE_STATUS[pedido.status]}</td>
                  <td className="py-3 pl-4 text-right font-mono text-sm font-medium text-tinta">
                    {formatarMoeda(pedido.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Pedidos;
