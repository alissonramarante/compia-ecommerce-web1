import { Minus, Plus } from 'lucide-react';
import { limitarQuantidade } from '../lib/produto';

interface Props {
  /**
   * Precisa ser único na página: o carrinho renderiza um seletor por linha,
   * e id repetido quebra a associação do `<label>`.
   */
  idDoCampo: string;
  /** Título do produto, para os rótulos fazerem sentido fora de contexto. */
  descricao: string;
  quantidade: number;
  /** Teto. `null` é ilimitado. */
  maximo: number | null;
  /** Mostra "Quantidade" ao lado. Na tabela do carrinho a coluna já diz. */
  rotuloVisivel?: boolean;
  aoMudar: (quantidade: number) => void;
}

/** Menos / campo / mais. O clamp é da lib; aqui só se chama. */
function SeletorQuantidade({
  idDoCampo,
  descricao,
  quantidade,
  maximo,
  rotuloVisivel = false,
  aoMudar,
}: Props) {
  const noPiso = quantidade <= 1;
  const noTeto = maximo !== null && quantidade >= maximo;

  const classeBotao =
    'flex h-10 w-10 items-center justify-center border border-grafite/40 text-tinta transition-colors hover:bg-tinta hover:text-papel disabled:cursor-not-allowed disabled:border-grafite/20 disabled:text-grafite/40 disabled:hover:bg-transparent disabled:hover:text-grafite/40';

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={idDoCampo}
        className={
          rotuloVisivel
            ? 'font-mono text-xs uppercase tracking-widest text-grafite'
            : 'sr-only'
        }
      >
        {rotuloVisivel ? 'Quantidade' : `Quantidade de ${descricao}`}
      </label>

      <div className="flex items-center">
        <button
          type="button"
          className={classeBotao}
          onClick={() => aoMudar(limitarQuantidade(quantidade - 1, maximo))}
          disabled={noPiso}
          aria-label={`Diminuir quantidade de ${descricao}`}
        >
          <Minus size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <input
          id={idDoCampo}
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
          aria-label={`Aumentar quantidade de ${descricao}`}
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      {rotuloVisivel && maximo !== null && (
        <span className="font-mono text-xs text-grafite">de {maximo}</span>
      )}
    </div>
  );
}

export default SeletorQuantidade;
