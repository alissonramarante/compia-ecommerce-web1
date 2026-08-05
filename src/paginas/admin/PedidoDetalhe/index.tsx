import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { StatusPedido } from '../../../types';
import { clientes } from '../../../mocks';
import { ROTULO_DE_STATUS } from '../../../lib/pedido';
import {
  cancelamentoDevolveEstoque,
  erroDaMudancaDeStatus,
  mensagemDeEmailEnviado,
  mudarStatus,
  transicoesValidas,
} from '../../../lib/statusPedido';
import { formatarCep, formatarData, formatarMoeda } from '../../../lib/formatadores';
import { usePedidos } from '../../../hooks/usePedidos';
import { useProdutos } from '../../../hooks/useProdutos';
import { useSinalTemporario } from '../../../hooks/useSinalTemporario';

const CLASSE_TITULO = 'font-display text-sm font-bold uppercase tracking-widest text-tinta';
const CLASSE_ROTULO = 'block font-display text-xs font-bold uppercase tracking-widest text-tinta';
const CLASSE_CAMPO = 'mt-2 w-full border border-grafite/40 bg-white px-3 py-2 text-sm text-tinta';

/**
 * Detalhe do pedido no painel: itens, entrega, pagamento e histórico
 * completo, mais o bloco de mudança de status.
 *
 * Só oferece as transições válidas a partir do estado atual — a máquina em
 * `lib/statusPedido.ts` decide, esta página só desenha as opções que ela
 * devolve. `enviado` exige código de rastreio antes de confirmar.
 *
 * O e-mail de confirmação é simulado: um toast aparece, mas nada é
 * registrado em log ainda — o `LogsContext` só existe a partir da Tarefa 4.
 */
function PedidoDetalhe() {
  const { numero } = useParams();
  const { pedidoPorNumero, atualizarPedido } = usePedidos();
  const { devolverEstoque } = useProdutos();
  const confirmacaoDeEmail = useSinalTemporario(4000);

  const pedido = pedidoPorNumero(numero ?? '');

  const [novoStatus, setNovoStatus] = useState<StatusPedido | ''>('');
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [mensagemEmail, setMensagemEmail] = useState('');

  if (pedido === undefined) {
    return (
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">
          Não encontramos este pedido.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-grafite">
          Confira o número, ou veja a lista completa.
        </p>
        <Link
          to="/admin/pedidos"
          className="mt-6 inline-block font-display text-sm text-azul hover:underline"
        >
          Voltar à lista
        </Link>
      </div>
    );
  }

  const cliente = clientes.find((candidato) => candidato.id === pedido.clienteId);
  const opcoes = transicoesValidas(pedido.status);

  const aoConfirmarMudanca = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (novoStatus === '') return;

    const mensagemDeErro = erroDaMudancaDeStatus(pedido.status, novoStatus, { codigoRastreio });
    if (mensagemDeErro !== null) {
      setErro(mensagemDeErro);
      return;
    }

    const agora = new Date().toISOString();
    const atualizado = mudarStatus(pedido, novoStatus, agora, {
      observacao: observacao.trim() === '' ? undefined : observacao.trim(),
      codigoRastreio: novoStatus === 'enviado' ? codigoRastreio : undefined,
    });

    if (novoStatus === 'cancelado' && cancelamentoDevolveEstoque(pedido.status)) {
      devolverEstoque(
        pedido.itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
      );
    }

    atualizarPedido(atualizado);
    setErro('');
    setNovoStatus('');
    setCodigoRastreio('');
    setObservacao('');

    if (cliente !== undefined) {
      setMensagemEmail(mensagemDeEmailEnviado(cliente.email));
      confirmacaoDeEmail.disparar();
    }
  };

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-grafite">Pedido</p>
      <h1 className="mt-2 font-mono text-2xl font-medium tracking-tight text-tinta">{pedido.numero}</h1>
      <p className="mt-2 text-sm text-tinta">
        {cliente?.nome ?? 'Cliente removido'}
        {cliente !== undefined && <span className="text-grafite"> · {cliente.email}</span>}
      </p>
      <p className="mt-4 inline-block border border-grafite/40 px-3 py-1 font-display text-sm font-semibold text-tinta">
        {ROTULO_DE_STATUS[pedido.status]}
      </p>
      <p className="mt-2 font-mono text-xs text-grafite">Feito em {formatarData(pedido.criadoEm)}</p>

      <div
        role="status"
        aria-live="polite"
        className={confirmacaoDeEmail.ativo ? 'mt-6 border-l-2 border-azul bg-white px-4 py-3 text-sm text-tinta' : 'sr-only'}
      >
        {confirmacaoDeEmail.ativo ? mensagemEmail : ''}
      </div>

      <div className="mt-10 space-y-10">
        {/* Itens */}
        <section aria-labelledby="titulo-itens">
          <h2 id="titulo-itens" className={CLASSE_TITULO}>
            Itens
          </h2>
          <ul className="mt-3 divide-y divide-grafite/20 border-y border-grafite/20">
            {pedido.itens.map((item) => (
              <li key={item.produtoId} className="flex items-baseline justify-between gap-4 py-3">
                <span className="text-sm text-tinta">
                  {item.titulo}
                  <span className="ml-2 font-mono text-xs text-grafite">{item.quantidade}×</span>
                </span>
                <span className="shrink-0 font-mono text-sm text-tinta">
                  {formatarMoeda(item.quantidade * item.precoUnitario)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-grafite">Subtotal</dt>
              <dd className="font-mono text-tinta">{formatarMoeda(pedido.subtotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-grafite">Frete</dt>
              <dd className="font-mono text-tinta">
                {pedido.entrega.valor === 0 ? 'Grátis' : formatarMoeda(pedido.entrega.valor)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-grafite/20 pt-2">
              <dt className="font-display text-sm font-bold text-tinta">Total</dt>
              <dd className="font-mono text-lg font-medium text-tinta">{formatarMoeda(pedido.total)}</dd>
            </div>
          </dl>
        </section>

        {/* Entrega */}
        <section aria-labelledby="titulo-entrega">
          <h2 id="titulo-entrega" className={CLASSE_TITULO}>
            Entrega
          </h2>

          {pedido.entrega.modalidade === 'download' && (
            <p className="mt-3 text-sm leading-relaxed text-grafite">Entrega por download. Sem frete.</p>
          )}

          {pedido.entrega.modalidade === 'retirada' && (
            <p className="mt-3 text-sm leading-relaxed text-grafite">Retirada na sede da editora.</p>
          )}

          {pedido.entrega.modalidade === 'envio' && pedido.entrega.endereco !== undefined && (
            <address className="mt-3 space-y-1 text-sm not-italic leading-relaxed text-grafite">
              <p className="text-tinta">
                {pedido.entrega.endereco.logradouro}, {pedido.entrega.endereco.numero}
              </p>
              <p>
                {pedido.entrega.endereco.bairro} — {pedido.entrega.endereco.cidade}/{pedido.entrega.endereco.uf}
              </p>
              <p className="font-mono text-xs">CEP {formatarCep(pedido.entrega.endereco.cep)}</p>
              {pedido.entrega.opcaoFrete !== undefined && (
                <p className="pt-2">
                  {pedido.entrega.opcaoFrete.nome} · {pedido.entrega.opcaoFrete.transportadora}
                </p>
              )}
              {pedido.entrega.codigoRastreio !== undefined && (
                <p className="pt-2">
                  Rastreio <span className="font-mono text-tinta">{pedido.entrega.codigoRastreio}</span>
                </p>
              )}
            </address>
          )}
        </section>

        {/* Pagamento */}
        <section aria-labelledby="titulo-pagamento">
          <h2 id="titulo-pagamento" className={CLASSE_TITULO}>
            Pagamento
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-grafite">Método</dt>
              <dd className="text-tinta">
                {pedido.pagamento.metodo === 'pix' ? 'PIX' : `Cartão${pedido.pagamento.bandeira !== undefined ? ` ${pedido.pagamento.bandeira}` : ''}`}
                {pedido.pagamento.ultimosDigitos !== undefined && (
                  <span className="ml-1 font-mono text-xs text-grafite">
                    final {pedido.pagamento.ultimosDigitos}
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-grafite">Status</dt>
              <dd className="font-mono text-xs uppercase text-tinta">{pedido.pagamento.status}</dd>
            </div>
            {pedido.pagamento.parcelas > 1 && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-grafite">Parcelas</dt>
                <dd className="font-mono text-tinta">{pedido.pagamento.parcelas}x</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Histórico */}
        <section aria-labelledby="titulo-historico">
          <h2 id="titulo-historico" className={CLASSE_TITULO}>
            Histórico
          </h2>
          <ol className="mt-4 border-l border-grafite/30 pl-5">
            {pedido.historico.map((evento, indice) => (
              <li key={`${evento.status}-${evento.em}-${indice}`} className="relative pb-5 last:pb-0">
                <span
                  aria-hidden="true"
                  className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-[9999px] bg-grafite"
                />
                <p className="font-display text-sm font-semibold text-tinta">
                  {ROTULO_DE_STATUS[evento.status]}
                </p>
                <p className="font-mono text-xs text-grafite">{formatarData(evento.em)}</p>
                {evento.observacao !== undefined && (
                  <p className="mt-1 text-sm leading-relaxed text-grafite">{evento.observacao}</p>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Mudar status */}
        {opcoes.length > 0 && (
          <section aria-labelledby="titulo-mudar-status" className="border border-grafite/30 bg-white p-5">
            <h2 id="titulo-mudar-status" className={CLASSE_TITULO}>
              Mudar status
            </h2>

            <form onSubmit={aoConfirmarMudanca} noValidate className="mt-4 space-y-4">
              <fieldset>
                <legend className={CLASSE_ROTULO}>Novo status</legend>
                <div className="mt-2 space-y-1">
                  {opcoes.map((status) => (
                    <label
                      key={status}
                      htmlFor={`novo-status-${status}`}
                      className="flex cursor-pointer items-center gap-2 py-1 text-sm text-tinta"
                    >
                      <input
                        type="radio"
                        id={`novo-status-${status}`}
                        name="novoStatus"
                        checked={novoStatus === status}
                        onChange={() => {
                          setNovoStatus(status);
                          setErro('');
                        }}
                        className="h-4 w-4 shrink-0 rounded-[9999px] border border-grafite/50 accent-azul"
                      />
                      {ROTULO_DE_STATUS[status]}
                    </label>
                  ))}
                </div>
              </fieldset>

              {novoStatus === 'enviado' && (
                <div>
                  <label htmlFor="codigo-rastreio" className={CLASSE_ROTULO}>
                    Código de rastreio
                  </label>
                  <input
                    id="codigo-rastreio"
                    value={codigoRastreio}
                    onChange={(evento) => setCodigoRastreio(evento.target.value)}
                    className={`${CLASSE_CAMPO} font-mono`}
                  />
                </div>
              )}

              {novoStatus === 'cancelado' && cancelamentoDevolveEstoque(pedido.status) && (
                <p className="text-xs leading-relaxed text-grafite">
                  Este pedido ainda não foi enviado: cancelar devolve os itens ao estoque.
                </p>
              )}
              {novoStatus === 'cancelado' && !cancelamentoDevolveEstoque(pedido.status) && (
                <p className="text-xs leading-relaxed text-grafite">
                  Este pedido já foi enviado: cancelar não devolve os itens ao estoque.
                </p>
              )}

              <div>
                <label htmlFor="observacao-status" className={CLASSE_ROTULO}>
                  Observação (opcional)
                </label>
                <textarea
                  id="observacao-status"
                  value={observacao}
                  onChange={(evento) => setObservacao(evento.target.value)}
                  rows={2}
                  className={CLASSE_CAMPO}
                />
              </div>

              <p role="alert" aria-live="polite" className="min-h-[1.25rem] text-sm text-ocre">
                {erro}
              </p>

              <button
                type="submit"
                disabled={novoStatus === ''}
                className="bg-azul px-5 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta disabled:cursor-not-allowed disabled:bg-grafite/40"
              >
                Confirmar mudança
              </button>
            </form>
          </section>
        )}
      </div>

      <p className="mt-12">
        <Link to="/admin/pedidos" className="font-display text-sm text-azul hover:underline">
          Voltar à lista
        </Link>
      </p>
    </div>
  );
}

export default PedidoDetalhe;
