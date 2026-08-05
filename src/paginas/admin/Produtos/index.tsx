import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';

import type { TipoProduto } from '../../../types';
import {
  estoqueBaixo,
  filtrarProdutos,
  lerFiltrosDaUrl,
  ordenarProdutos,
  precoVigente,
} from '../../../lib/catalogo';
import { kitsQueReferenciam } from '../../../lib/produto';
import { formatarMoeda } from '../../../lib/formatadores';
import { podeEditar } from '../../../lib/permissoes';
import { useProdutos } from '../../../hooks/useProdutos';
import { useSessao } from '../../../hooks/useSessao';
import CampoBusca from '../../../components/CampoBusca';

const ROTULO_DE_TIPO: Record<TipoProduto, string> = {
  fisico: 'Físico',
  ebook: 'E-book',
  kit: 'Kit',
};

const TIPOS: { valor: TipoProduto; rotulo: string }[] = [
  { valor: 'fisico', rotulo: 'Físico' },
  { valor: 'ebook', rotulo: 'E-book' },
  { valor: 'kit', rotulo: 'Kit' },
];

const CLASSE_CABECALHO =
  'py-3 pr-4 text-left font-display text-xs font-bold uppercase tracking-widest text-grafite';

/**
 * Lista do catálogo, com busca e filtro por tipo reaproveitando
 * `lib/catalogo.ts` — a mesma filtragem da vitrine, não uma reescrita.
 *
 * `vendedor` só lê: sem "Novo produto", sem editar, sem excluir. A rota do
 * formulário protege o mesmo limite (`AreaProtegida exigeEdicao`), então
 * esconder os botões aqui é conveniência, não a proteção em si.
 */
function Produtos() {
  const [parametros, setParametros] = useSearchParams();
  const { produtos, excluirProduto } = useProdutos();
  const { usuarioCorrente } = useSessao();

  // AreaProtegida já garante usuarioCorrente não-nulo nesta rota.
  const podeGerenciar = usuarioCorrente !== null && podeEditar(usuarioCorrente.perfil, 'produtos');

  const filtros = lerFiltrosDaUrl(parametros);
  const resultado = ordenarProdutos(filtrarProdutos(produtos, filtros), 'titulo_az');

  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null);
  const [bloqueio, setBloqueio] = useState<{ produto: string; kits: string[] } | null>(null);

  const definirBusca = (escrita: { valor: string; empilhar: boolean }) => {
    const proximos = new URLSearchParams(parametros);
    if (escrita.valor.trim() === '') proximos.delete('busca');
    else proximos.set('busca', escrita.valor.trim());
    setParametros(proximos, { replace: !escrita.empilhar });
  };

  const definirTipo = (tipo: string) => {
    const proximos = new URLSearchParams(parametros);
    if (tipo === '') proximos.delete('tipo');
    else proximos.set('tipo', tipo);
    setParametros(proximos);
  };

  const pedirExclusao = (produtoId: string, titulo: string) => {
    const kits = kitsQueReferenciam(produtos, produtoId);

    if (kits.length > 0) {
      setBloqueio({ produto: titulo, kits: kits.map((kit) => kit.titulo) });
      setConfirmandoExclusao(null);
      return;
    }

    setBloqueio(null);
    setConfirmandoExclusao(produtoId);
  };

  const confirmarExclusao = () => {
    if (confirmandoExclusao === null) return;
    excluirProduto(confirmandoExclusao);
    setConfirmandoExclusao(null);
  };

  const produtoEmExclusao = produtos.find((produto) => produto.id === confirmandoExclusao);

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">
          Produtos
        </h1>
        {podeGerenciar && (
          <Link
            to="/admin/produtos/novo"
            className="flex items-center gap-2 bg-azul px-4 py-2 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            Novo produto
          </Link>
        )}
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:max-w-xs sm:flex-1">
          <CampoBusca valor={filtros.busca} aoAplicar={definirBusca} />
        </div>

        <div>
          <label htmlFor="filtro-tipo" className="sr-only">
            Filtrar por tipo
          </label>
          <select
            id="filtro-tipo"
            value={filtros.tipos[0] ?? ''}
            onChange={(evento) => definirTipo(evento.target.value)}
            className="border border-grafite/40 bg-white px-3 py-2 text-sm text-tinta"
          >
            <option value="">Todos os tipos</option>
            {TIPOS.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {bloqueio !== null && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-ocre bg-white px-4 py-3 text-sm leading-relaxed text-tinta"
        >
          &ldquo;{bloqueio.produto}&rdquo; não pode ser excluído: compõe{' '}
          {bloqueio.kits.length === 1
            ? `o kit "${bloqueio.kits[0]}"`
            : `os kits ${bloqueio.kits.map((kit) => `"${kit}"`).join(', ')}`}
          .
          <button
            type="button"
            onClick={() => setBloqueio(null)}
            className="ml-3 font-display text-xs font-semibold uppercase tracking-wide text-azul hover:underline"
          >
            Entendi
          </button>
        </p>
      )}

      {confirmandoExclusao !== null && produtoEmExclusao !== undefined && (
        <div className="mt-4 border-l-2 border-ocre bg-white px-4 py-3">
          <p className="text-sm font-semibold leading-relaxed text-tinta">
            Excluir &ldquo;{produtoEmExclusao.titulo}&rdquo;? Isto não tem desfazer.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={confirmarExclusao}
              className="bg-tinta px-4 py-2 font-display text-sm font-semibold text-papel transition-colors hover:bg-azul"
            >
              Excluir
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoExclusao(null)}
              className="font-display text-sm text-azul hover:underline"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <p aria-live="polite" className="mt-6 font-mono text-xs uppercase tracking-widest text-grafite">
        {resultado.length} {resultado.length === 1 ? 'produto' : 'produtos'}
      </p>

      {resultado.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-grafite">
          Nenhum produto encontrado com estes filtros.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse">
            <caption className="sr-only">Lista de produtos do catálogo</caption>
            <thead>
              <tr className="border-b border-grafite/30">
                <th scope="col" className={CLASSE_CABECALHO}>
                  <span className="sr-only">Capa</span>
                </th>
                <th scope="col" className={CLASSE_CABECALHO}>
                  Título
                </th>
                <th scope="col" className={CLASSE_CABECALHO}>
                  Tipo
                </th>
                <th scope="col" className={CLASSE_CABECALHO}>
                  Preço
                </th>
                <th scope="col" className={CLASSE_CABECALHO}>
                  Estoque
                </th>
                <th scope="col" className={CLASSE_CABECALHO}>
                  Destaque
                </th>
                {podeGerenciar && (
                  <th scope="col" className={CLASSE_CABECALHO}>
                    <span className="sr-only">Ações</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {resultado.map((produto) => {
                const capa = produto.imagens[0];

                return (
                  <tr key={produto.id} className="border-b border-grafite/20 align-middle">
                    <td className="py-3 pr-4">
                      {capa === undefined ? (
                        <div className="flex h-14 w-10 items-center justify-center border border-grafite/25 bg-papel text-[9px] text-grafite">
                          —
                        </div>
                      ) : (
                        <img
                          src={capa}
                          alt=""
                          width={40}
                          height={56}
                          className="h-14 w-10 border border-grafite/25 object-cover"
                        />
                      )}
                    </td>

                    <td className="py-3 pr-4">
                      {podeGerenciar ? (
                        <Link
                          to={`/admin/produtos/${produto.id}`}
                          className="font-display text-sm font-semibold text-tinta hover:text-azul"
                        >
                          {produto.titulo}
                        </Link>
                      ) : (
                        <span className="font-display text-sm font-semibold text-tinta">
                          {produto.titulo}
                        </span>
                      )}
                    </td>

                    <td className="py-3 pr-4 font-mono text-xs uppercase tracking-wide text-grafite">
                      {ROTULO_DE_TIPO[produto.tipo]}
                    </td>

                    <td className="py-3 pr-4 font-mono text-sm text-tinta">
                      {formatarMoeda(precoVigente(produto))}
                    </td>

                    <td className="py-3 pr-4 font-mono text-xs">
                      {produto.estoque === null ? (
                        <span className="text-grafite">Ilimitado</span>
                      ) : produto.estoque === 0 ? (
                        <span className="uppercase tracking-wide text-tinta">Esgotado</span>
                      ) : estoqueBaixo(produto) ? (
                        <span className="font-semibold text-ocre">{produto.estoque}</span>
                      ) : (
                        <span className="text-tinta">{produto.estoque}</span>
                      )}
                    </td>

                    <td className="py-3 pr-4">
                      {produto.destaque ? (
                        <Star
                          size={14}
                          strokeWidth={1.75}
                          fill="currentColor"
                          className="text-tinta"
                          aria-label="Produto em destaque"
                        />
                      ) : (
                        <span aria-hidden="true" className="text-grafite">
                          —
                        </span>
                      )}
                    </td>

                    {podeGerenciar && (
                      <td className="py-3 pl-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/admin/produtos/${produto.id}`}
                            aria-label={`Editar ${produto.titulo}`}
                            className="p-1 text-grafite transition-colors hover:text-azul"
                          >
                            <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => pedirExclusao(produto.id, produto.titulo)}
                            aria-label={`Excluir ${produto.titulo}`}
                            className="p-1 text-grafite transition-colors hover:text-tinta"
                          >
                            <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Produtos;
