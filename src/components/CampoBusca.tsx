import { Search } from 'lucide-react';

interface Props {
  /** Termo atual, vindo da URL. */
  valor: string;
  aoBuscar: (termo: string) => void;
}

/**
 * Busca aplicada no envio, não a cada tecla: assim o botão voltar desfaz a
 * busca inteira de uma vez, em vez de letra por letra.
 */
function CampoBusca({ valor, aoBuscar }: Props) {
  return (
    <form
      role="search"
      onSubmit={(evento) => {
        evento.preventDefault();
        const campo = evento.currentTarget.elements.namedItem('busca');
        if (campo instanceof HTMLInputElement) aoBuscar(campo.value);
      }}
      className="flex"
    >
      <label htmlFor="busca" className="sr-only">
        Buscar por título, subtítulo ou autor
      </label>
      <input
        /* A `key` remonta o campo quando o termo muda por fora — voltar no
           navegador ou limpar filtros precisa refletir aqui. */
        key={valor}
        id="busca"
        name="busca"
        type="search"
        defaultValue={valor}
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
