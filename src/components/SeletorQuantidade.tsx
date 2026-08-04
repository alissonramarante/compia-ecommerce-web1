import { Minus, Plus } from 'lucide-react';
import { limitarQuantidade } from '../lib/produto';

interface Props {
  quantidade: number;
  /** Teto. `null` é ilimitado — o componente não é usado nesse caso hoje. */
  maximo: number | null;
  aoMudar: (quantidade: number) => void;
}

/** Menos / campo / mais. O clamp é da lib; aqui só se chama. */
function SeletorQuantidade({ quantidade, maximo, aoMudar }: Props) {
  const noPiso = quantidade <= 1;
  const noTeto = maximo !== null && quantidade >= maximo;

  const classeBotao =
    'flex h-10 w-10 items-center justify-center border border-grafite/40 text-tinta transition-colors hover:bg-tinta hover:text-papel disabled:cursor-not-allowed disabled:border-grafite/20 disabled:text-grafite/40 disabled:hover:bg-transparent disabled:hover:text-grafite/40';

  return (
    <div className="flex items-center gap-2">
      <span id="rotulo-quantidade" className="font-mono text-xs uppercase tracking-widest text-grafite">
        Quantidade
      </span>

      <div className="flex items-center">
        <button
          type="button"
          className={classeBotao}
          onClick={() => aoMudar(limitarQuantidade(quantidade - 1, maximo))}
          disabled={noPiso}
          aria-label="Diminuir quantidade"
        >
          <Minus size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <label htmlFor="quantidade" className="sr-only">
          Quantidade
        </label>
        <input
          id="quantidade"
          type="number"
          inputMode="numeric"
          min={1}
          max={maximo ?? undefined}
          value={quantidade}
          onChange={(evento) => aoMudar(limitarQuantidade(Number(evento.target.value), maximo))}
          className="h-10 w-14 border-y border-grafite/40 bg-white text-center font-mono text-sm text-tinta"
        />

        <button
          type="button"
          className={classeBotao}
          onClick={() => aoMudar(limitarQuantidade(quantidade + 1, maximo))}
          disabled={noTeto}
          aria-label="Aumentar quantidade"
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      {maximo !== null && (
        <span className="font-mono text-xs text-grafite">de {maximo}</span>
      )}
    </div>
  );
}

export default SeletorQuantidade;
