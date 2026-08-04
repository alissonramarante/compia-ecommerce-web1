import type { FormatoEbook } from '../types';
import type { GrupoDeDownloads } from '../lib/conta';

interface Props {
  grupos: GrupoDeDownloads[];
  aoBaixar: (pedidoId: string, produtoId: string, formato: FormatoEbook) => void;
}

function ListaDeDownloads({ grupos, aoBaixar }: Props) {
  return (
    <ul className="space-y-5">
      {grupos.map((grupo) => (
        <li key={grupo.produtoId} className="border border-grafite/25 bg-white p-5">
          <h3 className="font-display text-base font-bold leading-snug tracking-tight text-tinta">
            {grupo.titulo}
          </h3>

          {/* Uma cota por compra. Duas compras do mesmo e-book aparecem como
              dois blocos, com o número do pedido, porque as cotas não se
              somam nem se misturam. */}
          {grupo.cotas.length > 1 && (
            <p className="mt-1 text-xs leading-relaxed text-grafite">
              Você comprou este título {grupo.cotas.length} vezes. Cada compra tem sua
              própria cota de downloads.
            </p>
          )}

          <ul className="mt-3 divide-y divide-grafite/20 border-t border-grafite/20">
            {grupo.cotas.map((cota) => {
              const esgotada = cota.downloadsRestantes <= 0;

              return (
                <li
                  key={`${cota.pedidoId}-${cota.formato}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                >
                  <span className="flex items-baseline gap-3">
                    {esgotada ? (
                      <span className="font-mono text-sm uppercase text-grafite/60">
                        {cota.formato}
                      </span>
                    ) : (
                      <a
                        href={cota.url}
                        onClick={(evento) => {
                          evento.preventDefault();
                          aoBaixar(cota.pedidoId, cota.produtoId, cota.formato);
                        }}
                        className="font-mono text-sm uppercase text-azul hover:underline"
                      >
                        {cota.formato}
                      </a>
                    )}
                    <span className="font-mono text-xs text-grafite">
                      {cota.numeroDoPedido}
                    </span>
                  </span>

                  {esgotada ? (
                    <span className="text-xs text-grafite">
                      Limite de downloads atingido. Fale com a editora para liberar mais.
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-grafite">
                      {cota.downloadsRestantes}{' '}
                      {cota.downloadsRestantes === 1 ? 'download restante' : 'downloads restantes'}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export default ListaDeDownloads;
