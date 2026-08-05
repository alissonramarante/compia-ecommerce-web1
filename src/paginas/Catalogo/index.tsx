import { Link, useSearchParams } from 'react-router-dom';

import { categorias } from '../../mocks';
import {
  contarFiltrosAtivos,
  contarPorCategoria,
  filtrarProdutos,
  lerFiltrosDaUrl,
  ordenarProdutos,
} from '../../lib/catalogo';
import { useProdutos } from '../../hooks/useProdutos';
import CampoBusca from '../../components/CampoBusca';
import CartaoProduto from '../../components/CartaoProduto';
import FiltrosCatalogo from '../../components/FiltrosCatalogo';
import GradeCategorias from '../../components/GradeCategorias';
import SemResultados from '../../components/SemResultados';

/**
 * Orquestra o catálogo. O estado inteiro está na URL: esta página lê os
 * parâmetros, delega o cálculo para `lib/catalogo.ts` e distribui o
 * resultado para componentes que não sabem que uma URL existe.
 */
function Catalogo() {
  const [parametros, setParametros] = useSearchParams();
  const { produtos } = useProdutos();

  /* 1. Leitura — a URL é a única fonte de verdade dos filtros. */
  const filtros = lerFiltrosDaUrl(parametros);
  const ehVisaoCategorias = parametros.get('visao') === 'categorias';
  const filtrosAtivos = contarFiltrosAtivos(filtros);

  /* 2. Cálculo — contagem sobre o catálogo inteiro, para a pessoa ver o que
        existe atrás de cada categoria, e não o que sobrou do filtro atual. */
  const contagemPorCategoria = contarPorCategoria(produtos);
  const resultado = ordenarProdutos(
    filtrarProdutos(produtos, filtros),
    filtros.ordenacao,
  );

  /* 3. Escrita — caixa e select empilham uma entrada de histórico, então o
        botão voltar desfaz um filtro por vez. Campo de texto empilha só no
        Enter/blur: enquanto se digita, `empilhar: false` substitui a entrada
        atual e a lista filtra ao vivo sem virar dez passos do "voltar". */
  const atualizar = (
    mutacao: (proximos: URLSearchParams) => void,
    empilhar = true,
  ) => {
    const proximos = new URLSearchParams(parametros);
    mutacao(proximos);
    setParametros(proximos, { replace: !empilhar });
  };

  const alternarValor = (chave: string, valor: string) =>
    atualizar((proximos) => {
      const atuais = proximos.getAll(chave);
      const restantes = atuais.includes(valor)
        ? atuais.filter((item) => item !== valor)
        : [...atuais, valor];

      proximos.delete(chave);
      for (const item of restantes) proximos.append(chave, item);
    });

  const definirValor = (chave: string, valor: string, empilhar = true) =>
    atualizar((proximos) => {
      if (valor.trim() === '') proximos.delete(chave);
      else proximos.set(chave, valor.trim());
    }, empilhar);

  /* Ordenação não é filtro (ver `contarFiltrosAtivos`), então sobrevive ao
     "Limpar filtros". */
  const limpar = () => {
    const proximos = new URLSearchParams();
    const ordem = parametros.get('ordem');
    if (ordem !== null) proximos.set('ordem', ordem);
    setParametros(proximos);
  };

  const total = resultado.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta md:text-4xl">
            {ehVisaoCategorias ? 'Categorias' : 'Catálogo'}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-grafite">
            {ehVisaoCategorias
              ? 'Seis frentes editoriais. Escolha uma para ver os títulos.'
              : 'Todo o catálogo da editora, com filtros por categoria, tipo e preço.'}
          </p>
        </div>

        {!ehVisaoCategorias && (
          <div className="md:w-80">
            <CampoBusca
              valor={filtros.busca}
              aoAplicar={(escrita) => definirValor('busca', escrita.valor, escrita.empilhar)}
            />
          </div>
        )}
      </header>

      {ehVisaoCategorias ? (
        <>
          <GradeCategorias
            categorias={categorias}
            contagemPorCategoria={contagemPorCategoria}
          />
          <p className="mt-6">
            <Link to="/catalogo" className="font-display text-sm text-azul hover:underline">
              Ver todos os títulos
            </Link>
          </p>
        </>
      ) : (
        <div className="grid gap-10 md:grid-cols-[16rem_1fr]">
          <aside>
            <h2 className="sr-only">Filtros</h2>
            <FiltrosCatalogo
              filtros={filtros}
              categorias={categorias}
              contagemPorCategoria={contagemPorCategoria}
              filtrosAtivos={filtrosAtivos}
              aoAlternarCategoria={(slug) => alternarValor('categoria', slug)}
              aoAlternarTipo={(tipo) => alternarValor('tipo', tipo)}
              aoMudarPreco={(campo, escrita) =>
                definirValor(campo, escrita.valor, escrita.empilhar)
              }
              aoAlternarEstoque={() =>
                definirValor('estoque', filtros.somenteEmEstoque ? '' : '1')
              }
              aoMudarOrdenacao={(ordenacao) => definirValor('ordem', ordenacao)}
              aoLimpar={limpar}
            />
          </aside>

          <section>
            <p
              aria-live="polite"
              className="mb-4 font-mono text-xs uppercase tracking-widest text-grafite"
            >
              {total} {total === 1 ? 'título' : 'títulos'}
            </p>

            {total === 0 ? (
              <SemResultados busca={filtros.busca} aoLimpar={limpar} />
            ) : (
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {resultado.map((produto) => (
                  <li key={produto.id}>
                    <CartaoProduto produto={produto} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Catalogo;
