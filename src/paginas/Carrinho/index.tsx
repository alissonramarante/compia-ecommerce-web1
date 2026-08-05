import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

import { linhasDoCarrinho, pesoTotal, totalDaLinha } from '../../lib/carrinho';
import { formatarMoeda } from '../../lib/formatadores';
import { useCarrinho } from '../../hooks/useCarrinho';
import { useProdutos } from '../../hooks/useProdutos';
import SeletorQuantidade from '../../components/SeletorQuantidade';

const CLASSE_CABECALHO_DE_COLUNA =
  'pb-3 text-left font-display text-xs font-bold uppercase tracking-widest text-grafite';

function Carrinho() {
  const {
    itens,
    subtotal,
    quantidadeTotal,
    avisos,
    remover,
    alterarQuantidade,
    descartarAviso,
  } = useCarrinho();
  const { produtos } = useProdutos();

  const linhas = linhasDoCarrinho(itens, produtos);
  const peso = pesoTotal(itens, produtos);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta md:text-4xl">
        Carrinho
      </h1>

      {/* Avisos da reconciliação com o catálogo */}
      {avisos.length > 0 && (
        <ul aria-live="polite" className="mt-6 space-y-2">
          {avisos.map((aviso) => (
            <li
              key={aviso.id}
              className="flex items-start justify-between gap-4 border-l-2 border-ocre bg-white px-4 py-3"
            >
              <p className="text-sm leading-relaxed text-tinta">{aviso.texto}</p>
              <button
                type="button"
                onClick={() => descartarAviso(aviso.id)}
                className="shrink-0 font-display text-xs font-semibold uppercase tracking-wide text-grafite hover:text-tinta"
              >
                Dispensar
              </button>
            </li>
          ))}
        </ul>
      )}

      {linhas.length === 0 ? (
        <div className="mt-10 border border-grafite/25 bg-white px-6 py-16 text-center">
          <p className="font-display text-lg font-bold tracking-tight text-tinta">
            Seu carrinho está vazio.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-grafite">
            Os títulos que você adicionar ficam guardados aqui, mesmo se fechar a aba.
          </p>
          <Link
            to="/catalogo"
            className="mt-6 inline-block bg-azul px-5 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
          <section>
            <table className="w-full border-collapse">
              <caption className="sr-only">
                Itens no carrinho: {quantidadeTotal} no total
              </caption>
              <thead>
                <tr className="border-b border-grafite/30">
                  <th scope="col" className={CLASSE_CABECALHO_DE_COLUNA}>
                    Título
                  </th>
                  <th
                    scope="col"
                    className={`${CLASSE_CABECALHO_DE_COLUNA} hidden md:table-cell`}
                  >
                    Preço
                  </th>
                  <th scope="col" className={CLASSE_CABECALHO_DE_COLUNA}>
                    Quantidade
                  </th>
                  <th scope="col" className={`${CLASSE_CABECALHO_DE_COLUNA} text-right`}>
                    Total
                  </th>
                  <th scope="col" className="pb-3">
                    <span className="sr-only">Remover</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {linhas.map(({ item, produto }) => {
                  const capa = produto.imagens[0];
                  const ehEbook = produto.tipo === 'ebook';

                  return (
                    <tr key={item.produtoId} className="border-b border-grafite/20 align-top">
                      <td className="py-4 pr-4">
                        <div className="flex gap-3">
                          {capa !== undefined && (
                            <img
                              src={capa}
                              alt={`Capa de ${produto.titulo}, de ${produto.autores.join(', ')}`}
                              width={48}
                              height={68}
                              className="h-[68px] w-12 shrink-0 border border-grafite/25 object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/produto/${produto.slug}`}
                              className="font-display text-sm font-bold leading-snug tracking-tight text-tinta hover:text-azul"
                            >
                              {produto.titulo}
                            </Link>
                            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-grafite">
                              {ehEbook ? 'E-book · entrega por download' : produto.tipo === 'kit' ? 'Kit' : 'Livro físico'}
                            </p>
                            {/* A coluna de preço some abaixo de 768px; aqui ele
                                reaparece junto do título. */}
                            <p className="mt-1 font-mono text-xs text-grafite md:hidden">
                              {formatarMoeda(item.precoUnitario)} cada
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="hidden py-4 pr-4 font-mono text-sm text-grafite md:table-cell">
                        {formatarMoeda(item.precoUnitario)}
                      </td>

                      <td className="py-4 pr-4">
                        {ehEbook ? (
                          <span className="font-mono text-sm text-grafite">1</span>
                        ) : (
                          <SeletorQuantidade
                            idDoCampo={`quantidade-${produto.id}`}
                            descricao={produto.titulo}
                            quantidade={item.quantidade}
                            maximo={produto.estoque}
                            aoMudar={(nova) => alterarQuantidade(produto, nova)}
                          />
                        )}
                      </td>

                      <td className="py-4 text-right font-mono text-sm font-medium text-tinta">
                        {formatarMoeda(totalDaLinha(item))}
                      </td>

                      <td className="py-4 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => remover(item.produtoId)}
                          aria-label={`Remover ${produto.titulo} do carrinho`}
                          className="p-2 text-grafite transition-colors hover:text-tinta"
                        >
                          <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="mt-6">
              <Link to="/catalogo" className="font-display text-sm text-azul hover:underline">
                Continuar comprando
              </Link>
            </p>
          </section>

          {/* Resumo */}
          <aside className="self-start border border-grafite/30 bg-white p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-tinta">
              Resumo
            </h2>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-grafite">Subtotal</dt>
                <dd className="font-mono text-base font-medium text-tinta">
                  {formatarMoeda(subtotal)}
                </dd>
              </div>

              {/* Despacho é decidido por peso, não por tipo: o kit também vai. */}
              {peso > 0 && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-grafite">Peso</dt>
                  <dd className="font-mono text-xs text-grafite">{peso} g</dd>
                </div>
              )}
            </dl>

            <p className="mt-4 border-t border-grafite/20 pt-4 text-xs leading-relaxed text-grafite">
              {peso > 0
                ? 'Frete e prazo são calculados no checkout, a partir do seu CEP.'
                : 'Pedido só com e-book: sem frete, entrega por download.'}
            </p>

            <Link
              to="/checkout"
              className="mt-5 block bg-azul px-6 py-3 text-center font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
            >
              Finalizar compra
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Carrinho;
