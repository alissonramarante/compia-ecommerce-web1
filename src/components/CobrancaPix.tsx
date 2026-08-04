import { QRCodeSVG } from 'qrcode.react';
import type { Pagamento } from '../types';
import { formatarData, formatarMoeda } from '../lib/formatadores';

interface Props {
  pagamento: Pagamento;
  expirada: boolean;
  aoSimularPagamento: () => void;
  aoRenovarCobranca: () => void;
}

/**
 * Cobrança PIX: QR em cima, copia e cola embaixo.
 *
 * O QR vem de `qrcode.react` — codificação Reed-Solomon e mascaramento
 * escritos à mão não teriam como ser verificados aqui, e um QR que não
 * decodifica é pior que nenhum. A biblioteca não traz dependência alguma.
 *
 * O copia e cola continua abaixo porque é o caminho realmente utilizável:
 * quem está no computador não aponta a câmera para a própria tela.
 *
 * O payload é fictício nos dois casos — nenhum banco vai aceitá-lo.
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
        Leia o código com o aplicativo do seu banco, ou copie o texto abaixo na opção
        “PIX copia e cola”. Vence em{' '}
        <span className="font-mono text-tinta">{formatarData(pagamento.expiraEm ?? '')}</span>.
      </p>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
        <figure className="shrink-0">
          {/* Fundo branco e moldura fina: QR sobre o papel levemente frio do
              tema perde contraste na leitura. */}
          <div className="inline-block border border-grafite/40 bg-white p-3">
            <QRCodeSVG
              value={pagamento.payloadPix ?? ''}
              size={168}
              level="M"
              marginSize={0}
              bgColor="#FFFFFF"
              fgColor="#101418"
              title={`Código PIX de ${formatarMoeda(pagamento.valor)}`}
            />
          </div>
          <figcaption className="mt-2 font-mono text-[11px] uppercase tracking-widest text-grafite">
            Valor {formatarMoeda(pagamento.valor)}
          </figcaption>
        </figure>

        <div className="min-w-0 flex-1">
          <label
            htmlFor="payload-pix"
            className="block font-display text-xs font-bold uppercase tracking-widest text-tinta"
          >
            PIX copia e cola
          </label>
          <textarea
            id="payload-pix"
            readOnly
            rows={4}
            value={pagamento.payloadPix ?? ''}
            onFocus={(evento) => evento.currentTarget.select()}
            className="mt-2 w-full resize-none break-all border border-grafite/40 bg-papel p-3 font-mono text-xs text-tinta"
          />
        </div>
      </div>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-grafite">
        O código é fictício, gerado no cliente: o QR é legível, mas nenhum aplicativo de
        banco vai aceitar este pagamento.
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
