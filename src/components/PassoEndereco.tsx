import type { Endereco, ModalidadeEntrega } from '../types';
import type { ErrosDoEndereco } from '../lib/checkout';
import { formatarCep } from '../lib/formatadores';

interface Props {
  endereco: Endereco;
  modalidade: ModalidadeEntrega;
  erros: ErrosDoEndereco;
  /** Campos já tocados: erro só aparece depois de sair do campo. */
  tocados: Set<string>;
  localDeRetirada: {
    nome: string;
    logradouro: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    horario: string;
  };
  aoMudarCampo: (campo: keyof Endereco, valor: string) => void;
  aoTocarCampo: (campo: keyof Endereco) => void;
  aoMudarModalidade: (modalidade: ModalidadeEntrega) => void;
}

const CLASSE_ROTULO =
  'block font-display text-xs font-bold uppercase tracking-widest text-tinta';
const CLASSE_CAMPO =
  'mt-2 w-full border border-grafite/40 bg-white px-3 py-2 text-sm text-tinta';

function PassoEndereco({
  endereco,
  modalidade,
  erros,
  tocados,
  localDeRetirada,
  aoMudarCampo,
  aoTocarCampo,
  aoMudarModalidade,
}: Props) {
  const campo = (
    nome: keyof Endereco,
    rotulo: string,
    extras: { largura?: string; maxLength?: number } = {},
  ) => {
    const erro = tocados.has(nome) ? erros[nome] : undefined;

    return (
      <div className={extras.largura ?? ''}>
        <label htmlFor={`endereco-${nome}`} className={CLASSE_ROTULO}>
          {rotulo}
        </label>
        <input
          id={`endereco-${nome}`}
          value={String(endereco[nome] ?? '')}
          maxLength={extras.maxLength}
          onChange={(evento) => aoMudarCampo(nome, evento.target.value)}
          onBlur={() => aoTocarCampo(nome)}
          aria-invalid={erro !== undefined}
          aria-describedby={erro !== undefined ? `erro-${nome}` : undefined}
          className={CLASSE_CAMPO}
        />
        <p id={`erro-${nome}`} aria-live="polite" className="mt-1 text-xs text-ocre">
          {erro ?? ''}
        </p>
      </div>
    );
  };

  return (
    <div>
      {/* Modalidade */}
      <fieldset>
        <legend className={CLASSE_ROTULO}>Como você quer receber</legend>

        <div className="mt-3 space-y-2">
          {(
            [
              { valor: 'envio', rotulo: 'Entrega no meu endereço' },
              { valor: 'retirada', rotulo: 'Retirar na sede da editora' },
            ] as const
          ).map((opcao) => (
            <label
              key={opcao.valor}
              htmlFor={`modalidade-${opcao.valor}`}
              className="flex cursor-pointer items-center gap-3 border border-grafite/30 bg-white p-3 text-sm text-tinta"
            >
              <input
                type="radio"
                id={`modalidade-${opcao.valor}`}
                name="modalidade"
                checked={modalidade === opcao.valor}
                onChange={() => aoMudarModalidade(opcao.valor)}
                /* Radio é círculo por convenção; o tema limita o raio a 4px. */
                className="h-4 w-4 shrink-0 rounded-[9999px] border border-grafite/50 accent-azul"
              />
              {opcao.rotulo}
            </label>
          ))}
        </div>
      </fieldset>

      {modalidade === 'retirada' ? (
        <div className="mt-8 border border-grafite/30 bg-white p-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-tinta">
            {localDeRetirada.nome}
          </h3>
          <address className="mt-3 space-y-1 text-sm not-italic leading-relaxed text-grafite">
            <p>{localDeRetirada.logradouro}</p>
            <p>
              {localDeRetirada.bairro} — {localDeRetirada.cidade}/{localDeRetirada.uf}
            </p>
            <p className="font-mono text-xs">CEP {formatarCep(localDeRetirada.cep)}</p>
            <p>{localDeRetirada.horario}</p>
          </address>
          <p className="mt-4 font-mono text-xs text-grafite">
            Retirada não tem frete.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-6">
          {campo('cep', 'CEP', { largura: 'sm:col-span-2', maxLength: 9 })}
          {campo('logradouro', 'Rua ou avenida', { largura: 'sm:col-span-4' })}
          {campo('numero', 'Número', { largura: 'sm:col-span-2' })}
          {campo('complemento', 'Complemento', { largura: 'sm:col-span-4' })}
          {campo('bairro', 'Bairro', { largura: 'sm:col-span-3' })}
          {campo('cidade', 'Cidade', { largura: 'sm:col-span-2' })}
          {campo('uf', 'UF', { largura: 'sm:col-span-1', maxLength: 2 })}
        </div>
      )}
    </div>
  );
}

export default PassoEndereco;
