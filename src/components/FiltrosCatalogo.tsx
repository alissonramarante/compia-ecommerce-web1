import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type {
  Categoria,
  FiltrosCatalogo as Filtros,
  OrdenacaoCatalogo,
  TipoProduto,
} from '../types';

interface Props {
  filtros: Filtros;
  categorias: Categoria[];
  /** Indexado pelo id da categoria, como devolve `contarPorCategoria`. */
  contagemPorCategoria: Record<string, number>;
  filtrosAtivos: number;
  /** Recebe o slug: é ele que vai para a URL. */
  aoAlternarCategoria: (slug: string) => void;
  aoAlternarTipo: (tipo: TipoProduto) => void;
  /** Valor em reais, como digitado. A conversão para centavos é da lib. */
  aoMudarPreco: (campo: 'precoMin' | 'precoMax', valorEmReais: string) => void;
  aoAlternarEstoque: () => void;
  /** String crua: quem valida é `lerFiltrosDaUrl`, na leitura. */
  aoMudarOrdenacao: (ordenacao: string) => void;
  aoLimpar: () => void;
}

const TIPOS: { valor: TipoProduto; rotulo: string }[] = [
  { valor: 'fisico', rotulo: 'Livro físico' },
  { valor: 'ebook', rotulo: 'E-book' },
  { valor: 'kit', rotulo: 'Kit' },
];

const ORDENACOES: { valor: OrdenacaoCatalogo; rotulo: string }[] = [
  { valor: 'relevancia', rotulo: 'Relevância' },
  { valor: 'lancamentos', rotulo: 'Lançamentos' },
  { valor: 'menor_preco', rotulo: 'Menor preço' },
  { valor: 'maior_preco', rotulo: 'Maior preço' },
  { valor: 'titulo_az', rotulo: 'Título (A–Z)' },
];

const CLASSE_LEGENDA =
  'font-display text-xs font-bold uppercase tracking-widest text-tinta';
const CLASSE_CAIXA =
  'h-4 w-4 shrink-0 border border-grafite/50 accent-azul';
const CLASSE_ITEM =
  'flex cursor-pointer items-center gap-2 py-1 text-sm text-tinta';

/** Reais, sem centavos: a faixa de preço não precisa dessa precisão. */
function emReais(centavos: number | undefined): string {
  return centavos === undefined ? '' : String(Math.round(centavos / 100));
}

function FiltrosCatalogo({
  filtros,
  categorias,
  contagemPorCategoria,
  filtrosAtivos,
  aoAlternarCategoria,
  aoAlternarTipo,
  aoMudarPreco,
  aoAlternarEstoque,
  aoMudarOrdenacao,
  aoLimpar,
}: Props) {
  /* Abrir e fechar o painel é estado de interface, não filtro — este é o
     único useState do catálogo. Fechado por padrão abaixo de 768px. */
  const [painelAberto, setPainelAberto] = useState(false);

  return (
    <div>
      {/* Gatilho do painel, só abaixo de 768px */}
      <button
        type="button"
        onClick={() => setPainelAberto((aberto) => !aberto)}
        aria-expanded={painelAberto}
        aria-controls="painel-de-filtros"
        className="flex w-full items-center justify-between border border-grafite/40 px-4 py-3 font-display text-sm font-semibold text-tinta md:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
          Filtros e ordenação
        </span>
        {filtrosAtivos > 0 && (
          <span className="border border-grafite/40 px-2 font-mono text-xs text-grafite">
            {filtrosAtivos}
          </span>
        )}
      </button>

      <div
        id="painel-de-filtros"
        className={`${painelAberto ? 'block' : 'hidden'} space-y-8 border border-t-0 border-grafite/40 p-4 md:block md:border-0 md:p-0`}
      >
        {/* Ordenação */}
        <div>
          <label htmlFor="ordenacao" className={CLASSE_LEGENDA}>
            Ordenar por
          </label>
          <select
            id="ordenacao"
            value={filtros.ordenacao}
            onChange={(evento) => aoMudarOrdenacao(evento.target.value)}
            className="mt-2 w-full border border-grafite/40 bg-white px-3 py-2 text-sm text-tinta"
          >
            {ORDENACOES.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </div>

        {/* Categoria */}
        <fieldset>
          <legend className={CLASSE_LEGENDA}>Categoria</legend>
          <ul className="mt-2">
            {categorias.map((categoria) => {
              const id = `categoria-${categoria.slug}`;
              const total = contagemPorCategoria[categoria.id] ?? 0;

              return (
                <li key={categoria.id}>
                  <label htmlFor={id} className={CLASSE_ITEM}>
                    <input
                      type="checkbox"
                      id={id}
                      checked={filtros.categoriaIds.includes(categoria.id)}
                      onChange={() => aoAlternarCategoria(categoria.slug)}
                      className={CLASSE_CAIXA}
                    />
                    <span className="flex-1">{categoria.nome}</span>
                    <span className="font-mono text-xs text-grafite">{total}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        {/* Tipo */}
        <fieldset>
          <legend className={CLASSE_LEGENDA}>Tipo</legend>
          <ul className="mt-2">
            {TIPOS.map((tipo) => {
              const id = `tipo-${tipo.valor}`;

              return (
                <li key={tipo.valor}>
                  <label htmlFor={id} className={CLASSE_ITEM}>
                    <input
                      type="checkbox"
                      id={id}
                      checked={filtros.tipos.includes(tipo.valor)}
                      onChange={() => aoAlternarTipo(tipo.valor)}
                      className={CLASSE_CAIXA}
                    />
                    {tipo.rotulo}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        {/* Faixa de preço */}
        <fieldset>
          <legend className={CLASSE_LEGENDA}>Faixa de preço</legend>
          <p className="mt-1 font-mono text-[11px] text-grafite">em reais</p>
          <div className="mt-2 flex items-center gap-2">
            {(['precoMin', 'precoMax'] as const).map((campo) => (
              <div key={campo} className="flex-1">
                <label htmlFor={campo} className="sr-only">
                  {campo === 'precoMin' ? 'Preço mínimo' : 'Preço máximo'}
                </label>
                <input
                  /* Sem `value`: o campo é aplicado ao sair ou no Enter, para
                     não empilhar uma entrada de histórico por tecla. A `key`
                     força o remonte quando a URL muda por fora — é o que faz
                     "Limpar filtros" esvaziar o campo. */
                  key={`${campo}-${emReais(filtros[campo])}`}
                  id={campo}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={10}
                  placeholder={campo === 'precoMin' ? 'mín.' : 'máx.'}
                  defaultValue={emReais(filtros[campo])}
                  onBlur={(evento) => aoMudarPreco(campo, evento.target.value)}
                  onKeyDown={(evento) => {
                    if (evento.key === 'Enter') evento.currentTarget.blur();
                  }}
                  className="w-full border border-grafite/40 bg-white px-3 py-2 font-mono text-sm text-tinta"
                />
              </div>
            ))}
          </div>
        </fieldset>

        {/* Disponibilidade */}
        <div>
          <label htmlFor="estoque" className={CLASSE_ITEM}>
            <input
              type="checkbox"
              id="estoque"
              checked={filtros.somenteEmEstoque}
              onChange={aoAlternarEstoque}
              className={CLASSE_CAIXA}
            />
            Somente em estoque
          </label>
        </div>

        {filtrosAtivos > 0 && (
          <button
            type="button"
            onClick={aoLimpar}
            className="w-full border border-tinta px-4 py-2 font-display text-sm font-semibold text-tinta transition-colors hover:bg-tinta hover:text-papel"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}

export default FiltrosCatalogo;
