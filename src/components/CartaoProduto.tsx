import { Link } from 'react-router-dom';
import type { Produto, TipoProduto } from '../types';
import { formatarMoeda } from '../lib/formatadores';
import {
  estaDisponivel,
  estoqueBaixo,
  percentualDeDesconto,
  precoVigente,
} from '../lib/catalogo';

interface Props {
  produto: Produto;
}

/** Etiqueta de tipo. Livro físico é o padrão da casa e não recebe etiqueta. */
const ROTULO_DE_TIPO: Record<TipoProduto, string | null> = {
  fisico: null,
  ebook: 'E-book',
  kit: 'Kit',
};

function CartaoProduto({ produto }: Props) {
  const preco = precoVigente(produto);
  const desconto = percentualDeDesconto(produto);
  const disponivel = estaDisponivel(produto);
  const ultimasUnidades = estoqueBaixo(produto);
  const rotuloDeTipo = ROTULO_DE_TIPO[produto.tipo];
  const capa = produto.imagens[0];

  return (
    <article className="group h-full">
      <Link
        to={`/produto/${produto.slug}`}
        className="flex h-full flex-col border border-grafite/25 bg-white transition-colors hover:border-tinta"
      >
        {/* Capa */}
        <div className="relative overflow-hidden border-b border-grafite/25 bg-papel">
          {capa === undefined ? (
            <div className="flex aspect-[480/680] items-center justify-center">
              <span className="font-mono text-xs text-grafite">sem capa</span>
            </div>
          ) : (
            <img
              src={capa}
              alt={`Capa de ${produto.titulo}, de ${produto.autores.join(', ')}`}
              loading="lazy"
              width={480}
              height={680}
              /* Esgotado dessatura só a capa: aplicar opacidade no cartão
                 inteiro derrubaria o contraste do texto. */
              className={`aspect-[480/680] w-full object-cover transition-transform duration-200 group-hover:scale-[1.02] ${
                disponivel ? '' : 'grayscale'
              }`}
            />
          )}

          {/* Selos. No máximo um por cartão, por ordem de urgência. */}
          {!disponivel && (
            <span className="absolute left-0 top-0 bg-tinta px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-papel">
              Esgotado
            </span>
          )}
          {disponivel && desconto !== null && (
            <span className="absolute left-0 top-0 bg-riso px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-tinta">
              −{desconto}%
            </span>
          )}
          {disponivel && desconto === null && ultimasUnidades && (
            <span className="absolute left-0 top-0 bg-ocre px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-tinta">
              Últimas unidades
            </span>
          )}
        </div>

        {/* Texto */}
        <div className="flex flex-1 flex-col gap-1 p-4">
          {rotuloDeTipo !== null && (
            <p className="font-mono text-[11px] uppercase tracking-widest text-grafite">
              {rotuloDeTipo}
            </p>
          )}

          <h3 className="font-display text-base font-bold leading-snug tracking-tight text-tinta">
            {produto.titulo}
          </h3>

          {produto.subtitulo !== undefined && (
            <p className="text-sm leading-snug text-grafite">{produto.subtitulo}</p>
          )}

          <p className="mt-1 text-sm text-grafite">{produto.autores.join(', ')}</p>

          {/* Preço */}
          <div className="mt-auto flex items-baseline gap-2 pt-4">
            <span className="font-mono text-base font-medium text-tinta">
              {formatarMoeda(preco)}
            </span>
            {desconto !== null && (
              <span className="font-mono text-xs text-grafite line-through">
                {formatarMoeda(produto.preco)}
              </span>
            )}
          </div>

          {ultimasUnidades && produto.estoque !== null && (
            <p className="font-mono text-[11px] text-ocre-texto">
              {produto.estoque} em estoque
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}

export default CartaoProduto;
