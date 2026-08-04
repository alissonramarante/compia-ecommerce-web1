import type { OpcaoFrete } from '../types';
import { formatarMoeda } from '../lib/formatadores';

interface Props {
  opcoes: OpcaoFrete[];
  escolhida: string | null;
  cep: string;
  aoEscolher: (id: string) => void;
}

function PassoFrete({ opcoes, escolhida, cep, aoEscolher }: Props) {
  if (opcoes.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-grafite">
        Não há frete a calcular para este pedido.
      </p>
    );
  }

  return (
    <fieldset>
      <legend className="text-sm leading-relaxed text-grafite">
        Opções para o CEP <span className="font-mono text-tinta">{cep}</span>. Prazos em
        dias úteis, contados a partir da confirmação do pagamento.
      </legend>

      <ul className="mt-4 space-y-2">
        {opcoes.map((opcao) => (
          <li key={opcao.id}>
            <label
              htmlFor={`frete-${opcao.id}`}
              className="flex cursor-pointer items-center gap-3 border border-grafite/30 bg-white p-4"
            >
              <input
                type="radio"
                id={`frete-${opcao.id}`}
                name="frete"
                checked={escolhida === opcao.id}
                onChange={() => aoEscolher(opcao.id)}
                /* Radio é círculo por convenção; o tema limita o raio a 4px. */
                className="h-4 w-4 shrink-0 rounded-[9999px] border border-grafite/50 accent-azul"
              />

              <span className="flex-1">
                <span className="block font-display text-sm font-semibold text-tinta">
                  {opcao.nome}
                </span>
                <span className="block text-sm text-grafite">{opcao.transportadora}</span>
              </span>

              <span className="text-right">
                {/* Grátis é palavra, não R$ 0,00: o número esconde a notícia. */}
                <span className="block font-mono text-sm font-medium text-tinta">
                  {opcao.valor === 0 ? 'Grátis' : formatarMoeda(opcao.valor)}
                </span>
                <span className="block font-mono text-xs text-grafite">
                  {opcao.prazoDiasUteis}{' '}
                  {opcao.prazoDiasUteis === 1 ? 'dia útil' : 'dias úteis'}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

export default PassoFrete;
