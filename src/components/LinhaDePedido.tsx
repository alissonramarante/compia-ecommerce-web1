import { Link } from 'react-router-dom';
import type { Pedido, StatusPedido } from '../types';
import { ROTULO_DE_STATUS } from '../lib/pedido';
import { contarItens } from '../lib/carrinho';
import { formatarData, formatarMoeda } from '../lib/formatadores';

interface Props {
  pedido: Pedido;
  /** Vazio quando não há cobrança PIX em aberto. */
  tempoRestanteDoPix: string;
  cobrancaExpirada: boolean;
  aoComprarDeNovo: () => void;
}

/**
 * Cor semântica do status. `riso` fica de fora: é acento promocional, e
 * pedido cancelado não é promoção.
 */
const COR_DO_STATUS: Record<StatusPedido, string> = {
  aguardando_pagamento: 'text-ocre-texto',
  pago: 'text-tinta',
  em_separacao: 'text-tinta',
  enviado: 'text-tinta',
  pronto_para_retirada: 'text-tinta',
  entregue: 'text-tinta',
  cancelado: 'text-grafite',
};

function LinhaDePedido({
  pedido,
  tempoRestanteDoPix,
  cobrancaExpirada,
  aoComprarDeNovo,
}: Props) {
  const quantidade = contarItens(
    pedido.itens.map((item) => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
    })),
  );

  return (
    <article className="border border-grafite/25 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <Link
          to={`/pedido/${pedido.numero}`}
          className="font-mono text-base font-medium text-azul hover:underline"
        >
          {pedido.numero}
        </Link>
        <span className={`font-display text-sm font-semibold ${COR_DO_STATUS[pedido.status]}`}>
          {ROTULO_DE_STATUS[pedido.status]}
        </span>
      </div>

      <p className="mt-2 font-mono text-xs text-grafite">
        {formatarData(pedido.criadoEm)} · {quantidade}{' '}
        {quantidade === 1 ? 'item' : 'itens'} · {formatarMoeda(pedido.total)}
      </p>

      {/* Cobrança em aberto é ação pendente do cliente, não histórico. */}
      {tempoRestanteDoPix !== '' && (
        <p className="mt-3 border-l-2 border-ocre bg-papel px-3 py-2 text-sm text-tinta">
          PIX aguardando pagamento. Vence em{' '}
          <span className="font-mono">{tempoRestanteDoPix}</span>.{' '}
          <Link to={`/pedido/${pedido.numero}`} className="text-azul hover:underline">
            Pagar agora
          </Link>
        </p>
      )}

      {cobrancaExpirada && (
        <p className="mt-3 border-l-2 border-grafite/40 bg-papel px-3 py-2 text-sm text-grafite">
          A cobrança PIX expirou.{' '}
          <Link to={`/pedido/${pedido.numero}`} className="text-azul hover:underline">
            Gerar outra
          </Link>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Link
          to={`/pedido/${pedido.numero}`}
          className="font-display text-sm text-azul hover:underline"
        >
          Ver pedido
        </Link>
        <button
          type="button"
          onClick={aoComprarDeNovo}
          className="border border-grafite/40 px-3 py-1 font-display text-sm text-tinta transition-colors hover:border-tinta"
        >
          Comprar de novo
        </button>
      </div>
    </article>
  );
}

export default LinhaDePedido;
