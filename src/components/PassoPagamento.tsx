import type { BandeiraCartao, MetodoPagamento } from '../types';
import type { CampoDoCartao, ErrosDoCartao } from '../lib/checkout';
import type { DadosDoCartao } from '../lib/pagamento';
import { formatarMoeda } from '../lib/formatadores';

interface Props {
  metodo: MetodoPagamento | null;
  cartao: DadosDoCartao;
  bandeira: BandeiraCartao;
  erros: ErrosDoCartao;
  tocados: Set<string>;
  parcelas: number[];
  total: number;
  /** Recusa do processamento, diferente de erro de preenchimento. */
  erroDaCobranca: string;
  aoMudarMetodo: (metodo: MetodoPagamento) => void;
  aoMudarCartao: (campo: keyof DadosDoCartao, valor: string) => void;
  aoTocarCartao: (campo: CampoDoCartao) => void;
}

const CLASSE_ROTULO =
  'block font-display text-xs font-bold uppercase tracking-widest text-tinta';
const CLASSE_CAMPO =
  'mt-2 w-full border border-grafite/40 bg-white px-3 py-2 text-sm text-tinta';

const NOME_DA_BANDEIRA: Record<BandeiraCartao, string> = {
  visa: 'Visa',
  mastercard: 'MasterCard',
  elo: 'Elo',
  amex: 'American Express',
  desconhecida: '',
};

function PassoPagamento({
  metodo,
  cartao,
  bandeira,
  erros,
  tocados,
  parcelas,
  total,
  erroDaCobranca,
  aoMudarMetodo,
  aoMudarCartao,
  aoTocarCartao,
}: Props) {
  const campo = (
    nome: CampoDoCartao,
    rotulo: string,
    extras: { largura?: string; inputMode?: 'numeric'; maxLength?: number } = {},
  ) => {
    const erro = tocados.has(nome) ? erros[nome] : undefined;

    return (
      <div className={extras.largura ?? ''}>
        <label htmlFor={`cartao-${nome}`} className={CLASSE_ROTULO}>
          {rotulo}
        </label>
        <input
          id={`cartao-${nome}`}
          value={cartao[nome]}
          inputMode={extras.inputMode}
          maxLength={extras.maxLength}
          autoComplete="off"
          onChange={(evento) => aoMudarCartao(nome, evento.target.value)}
          onBlur={() => aoTocarCartao(nome)}
          aria-invalid={erro !== undefined}
          aria-describedby={erro !== undefined ? `erro-cartao-${nome}` : undefined}
          className={`${CLASSE_CAMPO} ${nome === 'nome' ? '' : 'font-mono'}`}
        />
        <p
          id={`erro-cartao-${nome}`}
          aria-live="polite"
          className="mt-1 text-xs text-ocre-texto"
        >
          {erro ?? ''}
        </p>
      </div>
    );
  };

  return (
    <div>
      <fieldset>
        <legend className={CLASSE_ROTULO}>Como você quer pagar</legend>

        <div className="mt-3 space-y-2">
          {(
            [
              { valor: 'pix', rotulo: 'PIX', detalhe: 'O código aparece depois de confirmar o pedido.' },
              { valor: 'cartao', rotulo: 'Cartão de crédito', detalhe: 'Até 6x sem juros.' },
            ] as const
          ).map((opcao) => (
            <label
              key={opcao.valor}
              htmlFor={`metodo-${opcao.valor}`}
              className="flex cursor-pointer items-start gap-3 border border-grafite/30 bg-white p-3"
            >
              <input
                type="radio"
                id={`metodo-${opcao.valor}`}
                name="metodo"
                checked={metodo === opcao.valor}
                onChange={() => aoMudarMetodo(opcao.valor)}
                /* Radio é círculo por convenção; o tema limita o raio a 4px. */
                className="mt-0.5 h-4 w-4 shrink-0 rounded-[9999px] border border-grafite/50 accent-azul"
              />
              <span>
                <span className="block text-sm font-semibold text-tinta">
                  {opcao.rotulo}
                </span>
                <span className="block text-sm text-grafite">{opcao.detalhe}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {metodo === 'cartao' && (
        <div className="mt-8">
          <div className="grid gap-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              {campo('numero', 'Número do cartão', { inputMode: 'numeric', maxLength: 23 })}
            </div>
            <div className="sm:col-span-2 sm:self-start">
              <p className={CLASSE_ROTULO}>Bandeira</p>
              <p
                aria-live="polite"
                className="mt-2 border border-transparent py-2 font-mono text-sm text-grafite"
              >
                {NOME_DA_BANDEIRA[bandeira] === ''
                  ? '—'
                  : NOME_DA_BANDEIRA[bandeira]}
              </p>
            </div>

            {campo('nome', 'Nome impresso no cartão', { largura: 'sm:col-span-6' })}
            {campo('validade', 'Validade', { largura: 'sm:col-span-2', inputMode: 'numeric', maxLength: 5 })}
            {campo('cvv', 'CVV', { largura: 'sm:col-span-2', inputMode: 'numeric', maxLength: 4 })}

            <div className="sm:col-span-2">
              <label htmlFor="cartao-parcelas" className={CLASSE_ROTULO}>
                Parcelas
              </label>
              <select
                id="cartao-parcelas"
                value={String(cartao.parcelas)}
                onChange={(evento) => aoMudarCartao('parcelas', evento.target.value)}
                className={CLASSE_CAMPO}
              >
                {parcelas.map((quantidade) => (
                  <option key={quantidade} value={quantidade}>
                    {quantidade}x de {formatarMoeda(Math.round(total / quantidade))}
                    {quantidade === 1 ? '' : ' sem juros'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="mt-4 font-mono text-xs leading-relaxed text-grafite">
            Simulação: nenhum dado do cartão sai desta tela nem é guardado. O cartão de
            teste 4000 0000 0000 0002 é sempre recusado.
          </p>
        </div>
      )}

      {/* Recusa do processamento. Região sempre presente para ser anunciada. */}
      <p
        aria-live="assertive"
        className={`mt-6 text-sm leading-relaxed ${erroDaCobranca === '' ? '' : 'border-l-2 border-ocre bg-white px-4 py-3 text-tinta'}`}
      >
        {erroDaCobranca}
      </p>
    </div>
  );
}

export default PassoPagamento;
