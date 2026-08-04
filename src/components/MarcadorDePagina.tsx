interface Props {
  nome: string;
}

/**
 * Placeholder da Fatia 1: a rota existe e é navegável, o conteúdo chega na
 * fatia correspondente do roadmap. Renderiza apenas o nome da página.
 */
function MarcadorDePagina({ nome }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-tinta">{nome}</h1>
    </div>
  );
}

export default MarcadorDePagina;
