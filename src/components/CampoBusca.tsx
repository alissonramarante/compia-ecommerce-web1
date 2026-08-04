import { Search } from 'lucide-react';
import { useCampoDebounced } from '../hooks/useCampoDebounced';
import type { EscritaDeFiltro } from '../lib/campoDebounced';

interface Props {
  /** Termo atual, vindo da URL. */
  valor: string;
  aoAplicar: (escrita: EscritaDeFiltro) => void;
}

/**
 * Filtra ao vivo enquanto se digita, substituindo a entrada de histórico, e
 * empilha uma entrada no Enter ou no blur. Assim a lista responde à tecla
 * sem transformar cada letra num passo do botão voltar.
 */
function CampoBusca({ valor, aoAplicar }: Props) {
  const campo = useCampoDebounced(valor, aoAplicar);

  return (
    <form
      role="search"
      onSubmit={(evento) => {
        evento.preventDefault();
        campo.aoConfirmar();
      }}
      className="flex"
    >
      <label htmlFor="busca" className="sr-only">
        Buscar por título, subtítulo ou autor
      </label>
      <input
        id="busca"
        name="busca"
        type="search"
        value={campo.valor}
        onChange={(evento) => campo.aoDigitar(evento.target.value)}
        onBlur={campo.aoConfirmar}
        placeholder="Buscar por título ou autor"
        className="w-full border border-grafite/40 bg-white px-3 py-2 text-sm text-tinta placeholder:text-grafite"
      />
      <button
        type="submit"
        className="flex items-center gap-2 border border-l-0 border-tinta bg-tinta px-4 py-2 font-display text-sm font-semibold text-papel transition-colors hover:bg-azul"
      >
        <Search size={16} strokeWidth={1.75} aria-hidden="true" />
        Buscar
      </button>
    </form>
  );
}

export default CampoBusca;
