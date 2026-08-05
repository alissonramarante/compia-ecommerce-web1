import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { localDeRetirada } from '../../mocks';
import { cobrancaExpirada } from '../../lib/pagamento';
import { ROTULO_DE_STATUS, aplicarPagamento, renovarCobrancaPix } from '../../lib/pedido';
import { formatarCep, formatarData, formatarMoeda } from '../../lib/formatadores';
import { usePedidos } from '../../hooks/usePedidos';
import { useProdutos } from '../../hooks/useProdutos';
import CobrancaPix from '../../components/CobrancaPix';

const CLASSE_TITULO =
  'font-display text-sm font-bold uppercase tracking-widest text-tinta';

function Pedido() {
  const { numero } = useParams();
  const { pedidoPorNumero, atualizarPedido } = usePedidos();
  const { produtos } = useProdutos();

  /* Fronteira do relógio, congelada na montagem: é o que decide se a
     cobrança PIX já venceu. As ações usam a hora do clique. */
  const [agora, setAgora] = useState(() => new Date().toISOString());

  const pedido = pedidoPorNumero(numero ?? '');

  useEffect(() => {
    if (pedido === undefined) return undefined;

    const anterior = document.title;
    document.title = `Pedido ${pedido.numero} — COMPIA Editora`;

    return () => {
      document.title = anterior;
    };
  }, [pedido]);

  if (pedido === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 md:px-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta">
          Não encontramos este pedido.
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-grafite">
          Confira o número no e-mail de confirmação, ou veja a lista completa na sua
          conta.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/conta"
            className="bg-azul px-5 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
          >
            Ver meus pedidos
          </Link>
          <Link
            to="/catalogo"
            className="px-5 py-3 font-display text-sm font-semibold text-azul hover:underline"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  const expirada = cobrancaExpirada(pedido.pagamento, agora);
  const aguardandoPix =
    pedido.pagamento.metodo === 'pix' && pedido.pagamento.status === 'pendente';

  const simularPagamento = () => {
    const agoraDoClique = new Date().toISOString();
    atualizarPedido(
      aplicarPagamento(
        pedido,
        { ...pedido.pagamento, status: 'aprovado' },
        agoraDoClique,
        produtos,
      ),
    );
    setAgora(agoraDoClique);
  };

  const renovarCobranca = () => {
    const agoraDoClique = new Date().toISOString();
    atualizarPedido(renovarCobrancaPix(pedido, agoraDoClique));
    setAgora(agoraDoClique);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-grafite">Pedido</p>
      <h1 className="mt-2 font-mono text-3xl font-medium tracking-tight text-tinta">
        {pedido.numero}
      </h1>

      <p className="mt-4 inline-block border border-grafite/40 px-3 py-1 font-display text-sm font-semibold text-tinta">
        {ROTULO_DE_STATUS[pedido.status]}
      </p>
      <p className="mt-2 font-mono text-xs text-grafite">
        Feito em {formatarData(pedido.criadoEm)}
      </p>

      <div className="mt-10 space-y-10">
        {/* Cobrança PIX em aberto */}
        {aguardandoPix && (
          <CobrancaPix
            pagamento={pedido.pagamento}
            expirada={expirada}
            aoSimularPagamento={simularPagamento}
            aoRenovarCobranca={renovarCobranca}
          />
        )}

        {/* Downloads */}
        {pedido.downloads !== undefined && pedido.downloads.length > 0 && (
          <section aria-labelledby="titulo-downloads">
            <h2 id="titulo-downloads" className={CLASSE_TITULO}>
              Seus arquivos
            </h2>
            <ul className="mt-3 divide-y divide-grafite/20 border-y border-grafite/20">
              {pedido.downloads.map((download) => (
                <li
                  key={`${download.produtoId}-${download.formato}`}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <a
                    href={download.url}
                    className="font-mono text-sm uppercase text-azul hover:underline"
                  >
                    {download.formato}
                  </a>
                  <span className="font-mono text-xs text-grafite">
                    {download.downloadsRestantes} downloads restantes
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-grafite">
              Os links são fictícios: este projeto não hospeda arquivo nenhum. Clicar não
              baixa nada.
            </p>
          </section>
        )}

        {/* Itens */}
        <section aria-labelledby="titulo-itens">
          <h2 id="titulo-itens" className={CLASSE_TITULO}>
            Itens
          </h2>
          <ul className="mt-3 divide-y divide-grafite/20 border-y border-grafite/20">
            {pedido.itens.map((item) => (
              <li
                key={item.produtoId}
                className="flex items-baseline justify-between gap-4 py-3"
              >
                <span className="text-sm text-tinta">
                  {item.titulo}
                  <span className="ml-2 font-mono text-xs text-grafite">
                    {item.quantidade}×
                  </span>
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
              <dd className="font-mono text-lg font-medium text-tinta">
                {formatarMoeda(pedido.total)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Entrega */}
        <section aria-labelledby="titulo-entrega">
          <h2 id="titulo-entrega" className={CLASSE_TITULO}>
            Entrega
          </h2>

          {pedido.entrega.modalidade === 'download' && (
            <p className="mt-3 text-sm leading-relaxed text-grafite">
              Entrega por download. Sem frete.
            </p>
          )}

          {pedido.entrega.modalidade === 'retirada' && (
            <address className="mt-3 space-y-1 text-sm not-italic leading-relaxed text-grafite">
              <p className="text-tinta">Retirada em {localDeRetirada.nome}</p>
              <p>{localDeRetirada.logradouro}</p>
              <p>
                {localDeRetirada.bairro} — {localDeRetirada.cidade}/{localDeRetirada.uf}
              </p>
              <p>{localDeRetirada.horario}</p>
            </address>
          )}

          {pedido.entrega.modalidade === 'envio' && pedido.entrega.endereco !== undefined && (
            <address className="mt-3 space-y-1 text-sm not-italic leading-relaxed text-grafite">
              <p className="text-tinta">
                {pedido.entrega.endereco.logradouro}, {pedido.entrega.endereco.numero}
              </p>
              <p>
                {pedido.entrega.endereco.bairro} — {pedido.entrega.endereco.cidade}/
                {pedido.entrega.endereco.uf}
              </p>
              <p className="font-mono text-xs">
                CEP {formatarCep(pedido.entrega.endereco.cep)}
              </p>
              {pedido.entrega.opcaoFrete !== undefined && (
                <p className="pt-2">
                  {pedido.entrega.opcaoFrete.nome} ·{' '}
                  {pedido.entrega.opcaoFrete.transportadora} ·{' '}
                  <span className="font-mono">
                    {pedido.entrega.opcaoFrete.prazoDiasUteis} dias úteis
                  </span>
                </p>
              )}
              {pedido.entrega.codigoRastreio !== undefined && (
                <p className="pt-2">
                  Rastreio{' '}
                  <span className="font-mono text-tinta">
                    {pedido.entrega.codigoRastreio}
                  </span>
                </p>
              )}
            </address>
          )}
        </section>

        {/* Histórico */}
        <section aria-labelledby="titulo-historico">
          <h2 id="titulo-historico" className={CLASSE_TITULO}>
            Acompanhamento
          </h2>
          <ol className="mt-4 border-l border-grafite/30 pl-5">
            {pedido.historico.map((evento, indice) => (
              <li key={`${evento.status}-${evento.em}-${indice}`} className="relative pb-5 last:pb-0">
                {/* Marcador de linha do tempo: círculo inevitável, e o tema
                    limita o raio a 4px. */}
                <span
                  aria-hidden="true"
                  className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-[9999px] bg-grafite"
                />
                <p className="font-display text-sm font-semibold text-tinta">
                  {ROTULO_DE_STATUS[evento.status]}
                </p>
                <p className="font-mono text-xs text-grafite">{formatarData(evento.em)}</p>
                {evento.observacao !== undefined && (
                  <p className="mt-1 text-sm leading-relaxed text-grafite">
                    {evento.observacao}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className="mt-12">
        <Link to="/catalogo" className="font-display text-sm text-azul hover:underline">
          Continuar comprando
        </Link>
      </p>
    </div>
  );
}

export default Pedido;
