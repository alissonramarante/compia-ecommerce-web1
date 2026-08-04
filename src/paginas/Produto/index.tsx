import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { categorias, produtos } from '../../mocks';
import {
  estaDisponivel,
  estoqueBaixo,
  percentualDeDesconto,
  precoVigente,
} from '../../lib/catalogo';
import {
  AUTOR_COLETIVO,
  buscarPorSlug,
  economiaDoKit,
  limitarQuantidade,
  nomesDasCategorias,
  produtosDoKit,
  relacionados,
} from '../../lib/produto';
import { formatarMoeda } from '../../lib/formatadores';
import { mensagemDeAdicao } from '../../lib/carrinho';
import { useCarrinho } from '../../hooks/useCarrinho';
import { useSinalTemporario } from '../../hooks/useSinalTemporario';
import BotaoAdicionarAoCarrinho from '../../components/BotaoAdicionarAoCarrinho';
import CartaoProduto from '../../components/CartaoProduto';
import FichaCatalografica from '../../components/FichaCatalografica';
import SeletorQuantidade from '../../components/SeletorQuantidade';

const LIMITE_DE_RELACIONADOS = 3;

const CLASSE_SUBTITULO_DE_BLOCO =
  'font-display text-xs font-bold uppercase tracking-widest text-tinta';

function Produto() {
  const { slug } = useParams();
  const produto = buscarPorSlug(produtos, slug ?? '');
  const [quantidade, setQuantidade] = useState(1);
  const { adicionar, quantidadeTotal } = useCarrinho();
  const confirmacao = useSinalTemporario(2000);

  /* Título da aba. Restaurado no desmonte para não vazar para a próxima
     rota — o React Router não recarrega a página. */
  useEffect(() => {
    if (produto === undefined) return undefined;

    const anterior = document.title;
    document.title = `${produto.titulo} — COMPIA Editora`;

    return () => {
      document.title = anterior;
    };
  }, [produto]);

  /* Slug que não existe falha à vista, na própria rota — mesmo princípio da
     categoria inexistente do catálogo. */
  if (produto === undefined) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 md:px-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta">
          Não encontramos este título.
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-grafite">
          O endereço pode ter um erro de digitação, ou o título saiu do catálogo.
        </p>
        <Link
          to="/catalogo"
          className="mt-8 inline-block bg-azul px-5 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  const preco = precoVigente(produto);
  const desconto = percentualDeDesconto(produto);
  const disponivel = estaDisponivel(produto);
  const ultimasUnidades = estoqueBaixo(produto);
  const capa = produto.imagens[0];

  const categoriasDoProduto = nomesDasCategorias(categorias, produto.categoriaIds);
  const categoriaPrincipal = categoriasDoProduto[0];

  const itensDoKit = produtosDoKit(produtos, produto);
  const kit = economiaDoKit(produtos, produto);
  const semelhantes = relacionados(produtos, produto, LIMITE_DE_RELACIONADOS);

  /* Num kit convivem dois percentuais de significados diferentes: o desconto
     sobre o preço de tabela do próprio kit e a economia contra comprar os
     avulsos. Dois "%" na mesma tela viram ruído, e a segunda é a informação
     que importa em um kit — então aqui o selo genérico some e fica só a
     comparação, sempre dizendo contra o quê. Na grade do catálogo o selo
     continua, porque lá não há espaço para a comparação. */
  const ehKit = produto.tipo === 'kit';
  const mostrarSeloDePromocao = disponivel && desconto !== null && !ehKit;

  /* Kit sem vantagem não ganha bloco de economia: melhor omitir do que
     anunciar economia negativa. */
  const kitCompensa = kit.economia > 0;

  const adicionarAoCarrinho = () => {
    adicionar(produto, quantidade);
    confirmacao.disparar();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      {/* Trilha */}
      <nav aria-label="Você está aqui" className="mb-10">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-xs text-grafite">
          <li>
            <Link to="/" className="hover:text-azul">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/catalogo" className="hover:text-azul">
              Catálogo
            </Link>
          </li>
          {categoriaPrincipal !== undefined && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  to={`/catalogo?categoria=${categoriaPrincipal.slug}`}
                  className="hover:text-azul"
                >
                  {categoriaPrincipal.nome}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-tinta">
            {produto.titulo}
          </li>
        </ol>
      </nav>

      {/* Capa | dados */}
      <div className="grid gap-10 lg:grid-cols-[24rem_1fr] lg:gap-16">
        <div className="relative self-start border border-grafite/25 bg-white">
          {capa === undefined ? (
            <div className="flex aspect-[480/680] items-center justify-center">
              <span className="font-mono text-xs text-grafite">sem capa</span>
            </div>
          ) : (
            <img
              src={capa}
              alt={`Capa de ${produto.titulo}, de ${produto.autores.join(', ')}`}
              width={480}
              height={680}
              /* Dessatura só a capa: opacidade no bloco inteiro derrubaria o
                 contraste do texto ao lado. */
              className={`aspect-[480/680] w-full object-cover ${disponivel ? '' : 'grayscale'}`}
            />
          )}

          {!disponivel && (
            <span className="absolute left-0 top-0 bg-tinta px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-papel">
              Esgotado
            </span>
          )}
          {mostrarSeloDePromocao && (
            <span className="absolute left-0 top-0 bg-riso px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-tinta">
              −{desconto}%
            </span>
          )}
          {disponivel && !mostrarSeloDePromocao && ultimasUnidades && (
            <span className="absolute left-0 top-0 bg-ocre px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-tinta">
              Últimas unidades
            </span>
          )}
        </div>

        <div>
          {produto.tipo !== 'fisico' && (
            <p className="font-mono text-[11px] uppercase tracking-widest text-grafite">
              {produto.tipo === 'ebook' ? 'E-book' : 'Kit'}
            </p>
          )}

          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-tinta md:text-4xl">
            {produto.titulo}
          </h1>

          {produto.subtitulo !== undefined && (
            <p className="mt-3 text-lg leading-snug text-grafite">{produto.subtitulo}</p>
          )}

          {/* Autores. A sentinela de autoria coletiva é rótulo, não pessoa:
              não vira link de busca. */}
          <p className="mt-4 text-base text-grafite">
            {produto.autores.map((autor, indice) => (
              <span key={autor}>
                {indice > 0 && ', '}
                {autor === AUTOR_COLETIVO ? (
                  autor
                ) : (
                  <Link
                    to={`/catalogo?busca=${encodeURIComponent(autor)}`}
                    className="text-azul hover:underline"
                  >
                    {autor}
                  </Link>
                )}
              </span>
            ))}
          </p>

          {/* Preço */}
          <div className="mt-8 flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-3xl font-medium text-tinta">
              {formatarMoeda(preco)}
            </span>
            {desconto !== null && (
              <span className="font-mono text-base text-grafite line-through">
                {formatarMoeda(produto.preco)}
              </span>
            )}
            {/* O percentual só aparece quando é o único da tela; no kit ele
                daria a entender que a economia é contra os avulsos. */}
            {desconto !== null && !ehKit && (
              <span className="font-mono text-sm font-medium text-riso">
                {desconto}% abaixo do preço de tabela
              </span>
            )}
            {/* Sem o percentual, o valor riscado do kit ficaria sem
                referência — e há um segundo valor de referência na tela, a
                soma dos avulsos. Cada um diz o que é. */}
            {desconto !== null && ehKit && (
              <span className="font-mono text-xs text-grafite">
                preço de tabela do kit
              </span>
            )}
          </div>

          {ultimasUnidades && produto.estoque !== null && (
            <p className="mt-2 font-mono text-xs text-ocre">
              Últimas unidades: {produto.estoque} em estoque
            </p>
          )}

          {/* Compra */}
          <div className="mt-8 max-w-sm space-y-4">
            {/* E-book não tem quantidade: o download é um só. */}
            {produto.tipo !== 'ebook' && disponivel && (
              <SeletorQuantidade
                idDoCampo="quantidade"
                descricao={produto.titulo}
                quantidade={quantidade}
                maximo={produto.estoque}
                rotuloVisivel
                aoMudar={(nova) => setQuantidade(limitarQuantidade(nova, produto.estoque))}
              />
            )}

            <BotaoAdicionarAoCarrinho
              disponivel={disponivel}
              confirmado={confirmacao.ativo}
              onAdicionar={adicionarAoCarrinho}
            />

            {/* A região existe desde o primeiro render: leitor de tela só
                anuncia mudança dentro de um live region já presente. O
                retorno visual é a troca de texto do botão. */}
            <p aria-live="polite" className="sr-only">
              {confirmacao.ativo ? mensagemDeAdicao(produto.titulo, quantidadeTotal) : ''}
            </p>

            {produto.tipo === 'ebook' && (
              <div className="border border-grafite/30 bg-white p-4">
                <h2 className={CLASSE_SUBTITULO_DE_BLOCO}>Entrega</h2>
                <p className="mt-2 text-sm leading-relaxed text-grafite">
                  Download liberado assim que o pagamento é confirmado. Sem frete.
                </p>
                {produto.formatos !== undefined && produto.formatos.length > 0 && (
                  <p className="mt-2 font-mono text-xs uppercase tracking-wide text-tinta">
                    {produto.formatos.map((formato) => formato.toUpperCase()).join(' · ')}
                  </p>
                )}
              </div>
            )}

            {/* Vale para o livro físico e para o kit: os dois são despachados. */}
            {produto.peso > 0 && (
              <p className="font-mono text-xs text-grafite">
                Peso {produto.peso} g · frete calculado no checkout
              </p>
            )}
          </div>

          {/* Kit */}
          {itensDoKit.length > 0 && (
            <section className="mt-10 border border-grafite/30 bg-white p-5">
              <h2 className={CLASSE_SUBTITULO_DE_BLOCO}>O que vem no kit</h2>

              <ul className="mt-3 divide-y divide-grafite/20">
                {itensDoKit.map((item) => (
                  <li key={item.id} className="flex items-baseline justify-between gap-4 py-2">
                    <Link
                      to={`/produto/${item.slug}`}
                      className="text-sm text-azul hover:underline"
                    >
                      {item.titulo}
                    </Link>
                    <span className="shrink-0 font-mono text-xs text-grafite">
                      {formatarMoeda(precoVigente(item))}
                    </span>
                  </li>
                ))}
              </ul>

              {kitCompensa && (
                /* Prosa de venda, não dado catalográfico: sem monoespaçada.
                   O destaque nos valores é só de cor, na mesma serifada do
                   texto em volta. */
                <div className="mt-4 space-y-2 text-sm leading-relaxed text-grafite">
                  <p>
                    A soma dos três avulsos hoje é{' '}
                    <span className="text-tinta">{formatarMoeda(kit.soma)}</span>.
                  </p>
                  <p>
                    O kit sai por <span className="text-tinta">{formatarMoeda(preco)}</span>{' '}
                    — <span className="text-tinta">{formatarMoeda(kit.economia)}</span> a
                    menos, ou {kit.percentual}% abaixo da compra separada.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Descrição */}
          <div className="mt-10">
            <h2 className={CLASSE_SUBTITULO_DE_BLOCO}>Sobre o título</h2>
            <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-tinta">
              {produto.descricao}
            </p>
          </div>

          {/* Tags */}
          {produto.tags.length > 0 && (
            <div className="mt-8">
              <h2 className="sr-only">Assuntos</h2>
              <ul className="flex flex-wrap gap-2">
                {produto.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      to={`/catalogo?tag=${encodeURIComponent(tag)}`}
                      className="inline-block border border-grafite/40 px-2 py-1 font-mono text-[11px] text-grafite transition-colors hover:border-tinta hover:text-tinta"
                    >
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ficha catalográfica — ausente em kits */}
          {produto.ficha !== undefined && (
            <div className="mt-10 max-w-xl">
              <FichaCatalografica
                ficha={produto.ficha}
                titulo={produto.titulo}
                autores={produto.autores}
              />
            </div>
          )}
        </div>
      </div>

      {/* Relacionados */}
      {semelhantes.length > 0 && (
        <section className="mt-20 border-t border-grafite/25 pt-10">
          <h2 className="font-display text-2xl font-bold tracking-tight text-tinta">
            Relacionados
          </h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {semelhantes.map((semelhante) => (
              <li key={semelhante.id}>
                <CartaoProduto produto={semelhante} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default Produto;
