import { Check, ShoppingBag } from 'lucide-react';

interface Props {
  disponivel: boolean;
  /** Confirmação temporária. Quem controla o tempo é quem passa a prop. */
  confirmado?: boolean;
  onAdicionar: () => void;
}

/**
 * Esgotado desabilita de verdade, sem esconder o botão: a pessoa precisa ver
 * que o título existe e está fora. Nada de confirmação falsa de sucesso —
 * quem trata o clique é quem passa `onAdicionar`.
 */
function BotaoAdicionarAoCarrinho({ disponivel, confirmado = false, onAdicionar }: Props) {
  if (!disponivel) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="flex w-full items-center justify-center gap-2 border border-grafite/40 px-6 py-3 font-display text-sm font-semibold text-grafite"
      >
        Esgotado
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onAdicionar}
      className={`flex w-full items-center justify-center gap-2 px-6 py-3 font-display text-sm font-semibold text-papel transition-colors ${
        confirmado ? 'bg-tinta' : 'bg-azul hover:bg-tinta'
      }`}
    >
      {confirmado ? (
        <>
          <Check size={18} strokeWidth={2} aria-hidden="true" />
          Adicionado
        </>
      ) : (
        <>
          <ShoppingBag size={18} strokeWidth={1.75} aria-hidden="true" />
          Adicionar ao carrinho
        </>
      )}
    </button>
  );
}

export default BotaoAdicionarAoCarrinho;
