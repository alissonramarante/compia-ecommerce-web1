import type { Pagamento } from '../types';
import { formatarData, formatarMoeda } from '../lib/formatadores';

interface Props {
  pagamento: Pagamento;
  expirada: boolean;
  aoSimularPagamento: () => void;
  aoRenovarCobranca: () => void;
}

/**
 * Cobrança PIX. Não há QR desenhado: gerar um QR correto exige codificação
 * Reed-Solomon e mascaramento, e um QR errado é pior que nenhum — daria um
 * quadrado que nenhum aplicativo lê. Em vez disso, o payload aparece por
 * extenso, que é o "PIX copia e cola" real.
 */
function CobrancaPix({ pagamento, expirada, aoSimularPagamento, aoRenovarCobranca }: Props) {
  if (expirada) {
    return (
      <section
        aria-labelledby="titulo-pix"
        className="border border-grafite/30 bg-white p-5"
      >
        <h2
          id="titulo-pix"
          className="font-display text-sm font-bold uppercase tracking-widest text-tinta"
        >
          Cobrança expirada
        </h2>

        <p className="mt-3 max-w-prose text-sm leading-relaxed text-grafite">
          Esta cobrança PIX venceu em{' '}
          <span className="font-mono text-tinta">
            {formatarData(pagamento.expiraEm ?? '')}
          </span>{' '}
          e não pode mais ser paga. Gere outra pelo mesmo valor para continuar.
        </p>

        <button
          type="button"
          onClick={aoRenovarCobranca}
          className="mt-5 bg-azul px-5 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
        >
          Gerar nova cobrança
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-pix" className="border border-grafite/30 bg-white p-5">
      <h2
        id="titulo-pix"
        className="font-display text-sm font-bold uppercase tracking-widest text-tinta"
      >
        Pague com PIX
      </h2>

      <p className="mt-3 max-w-prose text-sm leading-relaxed text-grafite">
        Copie o código abaixo e cole no aplicativo do seu banco, na opção “PIX copia e
        cola”. Vence em{' '}
        <span className="font-mono text-tinta">{formatarData(pagamento.expiraEm ?? '')}</span>.
      </p>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-grafite">
        Valor {formatarMoeda(pagamento.valor)}
      </p>

      <label htmlFor="payload-pix" className="sr-only">
        Código PIX copia e cola
      </label>
      <textarea
        id="payload-pix"
        readOnly
        rows={3}
        value={pagamento.payloadPix ?? ''}
        onFocus={(evento) => evento.currentTarget.select()}
        className="mt-2 w-full resize-none break-all border border-grafite/40 bg-papel p-3 font-mono text-xs text-tinta"
      />

      <p className="mt-2 font-mono text-[11px] leading-relaxed text-grafite">
        Código fictício, gerado no cliente. Não há QR desenhado porque gerar um QR
        legível exigiria uma biblioteca, e um QR incorreto seria pior que nenhum.
      </p>

      <button
        type="button"
        onClick={aoSimularPagamento}
        className="mt-5 bg-azul px-5 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
      >
        Simular pagamento
      </button>
      <p className="mt-2 text-xs leading-relaxed text-grafite">
        Este projeto não tem integração bancária. O botão confirma o pagamento como se o
        PIX tivesse caído.
      </p>
    </section>
  );
}

export default CobrancaPix;
