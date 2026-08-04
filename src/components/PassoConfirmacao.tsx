import type { Endereco, MetodoPagamento, OpcaoFrete } from '../types';
import type { LinhaDoCarrinho } from '../lib/carrinho';
import { totalDaLinha } from '../lib/carrinho';
import { formatarCep, formatarMoeda } from '../lib/formatadores';

interface Props {
  linhas: LinhaDoCarrinho[];
  subtotal: number;
  frete: number;
  total: number;
  modalidade: 'envio' | 'retirada' | 'download';
  endereco: Endereco | null;
  localDeRetirada: { nome: string; logradouro: string; cidade: string; uf: string; horario: string };
  opcaoFrete: OpcaoFrete | null;
  metodo: MetodoPagamento | null;
  ultimosDigitos: string;
  parcelas: number;
}

const CLASSE_TITULO =
  'font-display text-xs font-bold uppercase tracking-widest text-tinta';

function PassoConfirmacao({
  linhas,
  subtotal,
  frete,
  total,
  modalidade,
  endereco,
  localDeRetirada,
  opcaoFrete,
  metodo,
  ultimosDigitos,
  parcelas,
}: Props) {
  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-grafite">
        Confira antes de confirmar. Nada é cobrado até você clicar no botão.
      </p>

      {/* Itens */}
      <section>
        <h3 className={CLASSE_TITULO}>Itens</h3>
        <ul className="mt-3 divide-y divide-grafite/20 border-y border-grafite/20">
          {linhas.map(({ item, produto }) => (
            <li key={item.produtoId} className="flex items-baseline justify-between gap-4 py-3">
              <span className="text-sm text-tinta">
                {produto.titulo}
                <span className="ml-2 font-mono text-xs text-grafite">
                  {item.quantidade}×
                </span>
              </span>
              <span className="shrink-0 font-mono text-sm text-tinta">
                {formatarMoeda(totalDaLinha(item))}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Entrega */}
      <section>
        <h3 className={CLASSE_TITULO}>Entrega</h3>

        {modalidade === 'download' && (
          <p className="mt-3 text-sm leading-relaxed text-grafite">
            Pedido só com e-book: entrega por download, sem frete.
          </p>
        )}

        {modalidade === 'retirada' && (
          <address className="mt-3 space-y-1 text-sm not-italic leading-relaxed text-grafite">
            <p className="text-tinta">Retirada em {localDeRetirada.nome}</p>
            <p>{localDeRetirada.logradouro}</p>
            <p>
              {localDeRetirada.cidade}/{localDeRetirada.uf}
            </p>
            <p>{localDeRetirada.horario}</p>
          </address>
        )}

        {modalidade === 'envio' && endereco !== null && (
          <address className="mt-3 space-y-1 text-sm not-italic leading-relaxed text-grafite">
            <p className="text-tinta">
              {endereco.logradouro}, {endereco.numero}
              {endereco.complemento === undefined || endereco.complemento === ''
                ? ''
                : ` — ${endereco.complemento}`}
            </p>
            <p>
              {endereco.bairro} — {endereco.cidade}/{endereco.uf}
            </p>
            <p className="font-mono text-xs">CEP {formatarCep(endereco.cep)}</p>
            {opcaoFrete !== null && (
              <p className="pt-2">
                {opcaoFrete.nome} · {opcaoFrete.transportadora} ·{' '}
                <span className="font-mono">
                  {opcaoFrete.prazoDiasUteis}{' '}
                  {opcaoFrete.prazoDiasUteis === 1 ? 'dia útil' : 'dias úteis'}
                </span>
              </p>
            )}
          </address>
        )}
      </section>

      {/* Pagamento */}
      <section>
        <h3 className={CLASSE_TITULO}>Pagamento</h3>
        <p className="mt-3 text-sm leading-relaxed text-grafite">
          {metodo === 'pix' ? (
            'PIX. O código para pagar aparece na próxima tela.'
          ) : (
            <>
              Cartão de crédito terminado em{' '}
              <span className="font-mono text-tinta">{ultimosDigitos}</span>, em{' '}
              <span className="font-mono text-tinta">{parcelas}x</span>
              {parcelas === 1 ? '' : ' sem juros'}.
            </>
          )}
        </p>
      </section>

      {/* Totais */}
      <section>
        <h3 className={CLASSE_TITULO}>Total</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-grafite">Subtotal</dt>
            <dd className="font-mono text-tinta">{formatarMoeda(subtotal)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-grafite">Frete</dt>
            <dd className="font-mono text-tinta">
              {frete === 0 ? 'Grátis' : formatarMoeda(frete)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-grafite/20 pt-2">
            <dt className="font-display text-sm font-bold text-tinta">Total</dt>
            <dd className="font-mono text-lg font-medium text-tinta">
              {formatarMoeda(total)}
            </dd>
          </div>
        </dl>
        <p className="mt-2 font-mono text-xs text-grafite">Impostos inclusos no preço.</p>
      </section>
    </div>
  );
}

export default PassoConfirmacao;
