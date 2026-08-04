import { useCampoDebounced } from '../hooks/useCampoDebounced';
import type { EscritaDeFiltro } from '../lib/campoDebounced';

interface Props {
  id: string;
  rotulo: string;
  placeholder: string;
  /** Valor em reais, já convertido pela página. */
  valor: string;
  aoAplicar: (escrita: EscritaDeFiltro) => void;
}

/**
 * Um dos dois campos da faixa de preço. Existe como componente próprio
 * porque cada campo precisa do seu próprio `useCampoDebounced`, e hook não
 * se chama dentro de laço.
 */
function CampoPreco({ id, rotulo, placeholder, valor, aoAplicar }: Props) {
  const campo = useCampoDebounced(valor, aoAplicar);

  return (
    <div className="flex-1">
      <label htmlFor={id} className="sr-only">
        {rotulo}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={10}
        placeholder={placeholder}
        value={campo.valor}
        onChange={(evento) => campo.aoDigitar(evento.target.value)}
        onBlur={campo.aoConfirmar}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter') evento.currentTarget.blur();
        }}
        className="w-full border border-grafite/40 bg-white px-3 py-2 font-mono text-sm text-tinta"
      />
    </div>
  );
}

export default CampoPreco;
