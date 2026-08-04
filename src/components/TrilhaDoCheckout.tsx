import { TITULO_DO_PASSO, type Passo } from '../lib/checkout';

interface Props {
  passos: Passo[];
  atual: Passo;
}

/** Indicador de progresso. Só leitura: navegar é pelos botões de cada passo. */
function TrilhaDoCheckout({ passos, atual }: Props) {
  const posicao = passos.indexOf(atual) + 1;

  return (
    <nav aria-label="Etapas do checkout" className="mb-10">
      <p className="sr-only">
        Passo {posicao} de {passos.length}: {TITULO_DO_PASSO[atual]}
      </p>

      <ol className="flex flex-wrap gap-x-6 gap-y-2">
        {passos.map((passo, indice) => {
          const concluido = indice + 1 < posicao;
          const ehAtual = passo === atual;

          return (
            <li key={passo} className="flex items-center gap-2">
              {/* Círculo é inevitável num marcador de passo: o tema limita o
                  raio a 4px, então aqui vale o valor arbitrário. */}
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 items-center justify-center rounded-[9999px] border font-mono text-xs ${
                  ehAtual
                    ? 'border-azul bg-azul text-papel'
                    : concluido
                      ? 'border-tinta text-tinta'
                      : 'border-grafite/40 text-grafite'
                }`}
              >
                {indice + 1}
              </span>
              <span
                className={`font-display text-sm tracking-tight ${
                  ehAtual ? 'font-semibold text-tinta' : 'text-grafite'
                }`}
              >
                {TITULO_DO_PASSO[passo]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default TrilhaDoCheckout;
