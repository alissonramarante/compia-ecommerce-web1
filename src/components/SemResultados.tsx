interface Props {
  /** Termo buscado, quando houver: a mensagem fica mais concreta com ele. */
  busca: string;
  aoLimpar: () => void;
}

/** Tela vazia do catálogo: explica o que houve e oferece a saída. */
function SemResultados({ busca, aoLimpar }: Props) {
  return (
    <div className="border border-grafite/25 bg-white px-6 py-16 text-center">
      <p className="font-display text-lg font-bold tracking-tight text-tinta">
        {busca.trim() === ''
          ? 'Nenhum título com esses filtros.'
          : `Nenhum título para “${busca}”.`}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-grafite">
        Tente uma combinação mais larga: menos categorias marcadas, uma faixa de preço
        maior, ou busque pelo sobrenome do autor.
      </p>
      <button
        type="button"
        onClick={aoLimpar}
        className="mt-6 border border-tinta px-5 py-2 font-display text-sm font-semibold text-tinta transition-colors hover:bg-tinta hover:text-papel"
      >
        Limpar filtros
      </button>
    </div>
  );
}

export default SemResultados;
