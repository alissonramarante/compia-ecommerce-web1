import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import type { FormatoEbook, TipoProduto } from '../../../types';
import { categorias } from '../../../mocks';
import {
  FORMULARIO_EM_BRANCO,
  gerarIdDeProduto,
  montarProduto,
  paraDadosDoFormulario,
  proximoSlugAoMudarTitulo,
  validar,
  type DadosDaFicha,
  type DadosDoFormulario,
  type ErrosDoFormulario,
} from '../../../lib/produtoFormulario';
import { criarLog } from '../../../lib/log';
import { useProdutos } from '../../../hooks/useProdutos';
import { useSessao } from '../../../hooks/useSessao';
import { useLogs } from '../../../hooks/useLogs';

const CLASSE_ROTULO = 'block font-display text-xs font-bold uppercase tracking-widest text-tinta';
const CLASSE_CAMPO = 'mt-2 w-full border border-grafite/40 bg-white px-3 py-2 text-sm text-tinta';
const CLASSE_ERRO = 'mt-1 text-xs text-ocre';
const CLASSE_LEGENDA = 'font-display text-xs font-bold uppercase tracking-widest text-tinta';
const CLASSE_ITEM_CAIXA = 'flex cursor-pointer items-center gap-2 py-1 text-sm text-tinta';
const CLASSE_CAIXA = 'h-4 w-4 shrink-0 border border-grafite/50 accent-azul';

const TIPOS: { valor: TipoProduto; rotulo: string }[] = [
  { valor: 'fisico', rotulo: 'Livro físico' },
  { valor: 'ebook', rotulo: 'E-book' },
  { valor: 'kit', rotulo: 'Kit' },
];

const FORMATOS: { valor: FormatoEbook; rotulo: string }[] = [
  { valor: 'pdf', rotulo: 'PDF' },
  { valor: 'epub', rotulo: 'EPUB' },
  { valor: 'mobi', rotulo: 'MOBI' },
];

const TODOS_OS_CAMPOS: (keyof ErrosDoFormulario)[] = [
  'titulo',
  'autores',
  'slug',
  'preco',
  'precoPromocional',
  'estoque',
  'peso',
  'formatos',
  'itensDoKit',
  'ficha',
];

function alternarEmLista<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor];
}

/**
 * Formulário único para criar e editar — a presença de `:id` na rota é o
 * que distingue os dois. Campos aparecem conforme o tipo:
 *   e-book — formatos, sem estoque/peso (forçados a `null`/`0` na montagem).
 *            Tem ficha catalográfica opcional, como o físico.
 *   kit    — itens do kit (mínimo dois), estoque e peso (também é
 *            despachado), sem ficha catalográfica.
 *   físico — estoque, peso e ficha catalográfica opcional.
 *
 * Validação em `lib/produtoFormulario.ts`, pura: este componente só lê o
 * mapa de erros e decide quando mostrá-lo (campo tocado).
 */
function ProdutoFormulario() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { produtos, produtoPorId, salvarProduto } = useProdutos();
  const { usuarioCorrente } = useSessao();
  const { logs, adicionarLog } = useLogs();

  const produtoExistente = id !== undefined ? produtoPorId(id) : undefined;
  const editando = id !== undefined;
  const naoEncontrado = editando && produtoExistente === undefined;

  const [dados, setDados] = useState<DadosDoFormulario>(() =>
    produtoExistente !== undefined ? paraDadosDoFormulario(produtoExistente) : FORMULARIO_EM_BRANCO,
  );
  /* Sugestão de slug só enquanto a pessoa não editou o campo à mão. Ao
     editar um produto existente, o slug já salvo não é regerado sozinho. */
  const [slugTocado, setSlugTocado] = useState(editando);
  const [tocados, setTocados] = useState<Set<string>>(new Set());
  const [tentouSalvar, setTentouSalvar] = useState(false);

  /* Troca de :id sem desmontar o componente (um link de edição para outro):
     recarrega os dados do produto novo, para não salvar por cima do errado. */
  useEffect(() => {
    setDados(produtoExistente !== undefined ? paraDadosDoFormulario(produtoExistente) : FORMULARIO_EM_BRANCO);
    setSlugTocado(editando);
    setTocados(new Set());
    setTentouSalvar(false);
    // eslint: dependência intencionalmente só em `id` — reage à troca de rota, não a toda edição de campo.
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const idAtual = produtoExistente?.id ?? null;
  const erros = validar(dados, produtos, idAtual);
  const erro = (campo: keyof ErrosDoFormulario) => (tocados.has(campo) ? erros[campo] : undefined);
  const tocar = (campo: keyof ErrosDoFormulario) =>
    setTocados((anteriores) => new Set(anteriores).add(campo));

  if (naoEncontrado) {
    return (
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">
          Não encontramos este produto.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-grafite">
          O endereço pode ter um erro de digitação, ou o produto foi excluído.
        </p>
        <Link
          to="/admin/produtos"
          className="mt-6 inline-block font-display text-sm text-azul hover:underline"
        >
          Voltar à lista
        </Link>
      </div>
    );
  }

  const atualizar = (patch: Partial<DadosDoFormulario>) =>
    setDados((anterior) => ({ ...anterior, ...patch }));

  const atualizarFicha = (patch: Partial<DadosDaFicha>) =>
    setDados((anterior) => ({ ...anterior, ficha: { ...anterior.ficha, ...patch } }));

  const aoMudarTitulo = (valor: string) =>
    setDados((anterior) => ({
      ...anterior,
      titulo: valor,
      slug: proximoSlugAoMudarTitulo(valor, anterior.slug, slugTocado),
    }));

  const aoMudarSlug = (valor: string) => {
    setSlugTocado(true);
    atualizar({ slug: valor });
  };

  const aoSubmeter = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setTentouSalvar(true);
    setTocados(new Set(TODOS_OS_CAMPOS));
    if (Object.keys(erros).length > 0) return;

    const produto = montarProduto(dados, {
      id: idAtual ?? gerarIdDeProduto(produtos),
      criadoEm: produtoExistente?.criadoEm ?? new Date().toISOString(),
    });

    salvarProduto(produto);

    // AreaProtegida (area="produtos" exigeEdicao) já garante usuarioCorrente não-nulo nesta rota.
    if (usuarioCorrente !== null) {
      adicionarLog(
        criarLog(
          logs,
          {
            usuarioId: usuarioCorrente.id,
            acao: editando ? 'produto_editado' : 'produto_criado',
            entidade: 'produto',
            entidadeId: produto.id,
            descricao: editando
              ? `Editou "${produto.titulo}"`
              : `Cadastrou "${produto.titulo}"`,
          },
          new Date().toISOString(),
        ),
      );
    }

    navegar('/admin/produtos');
  };

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-grafite">
        {editando ? 'Editar produto' : 'Novo produto'}
      </p>
      <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-tinta">
        {editando ? produtoExistente?.titulo : 'Cadastrar produto'}
      </h1>

      <form onSubmit={aoSubmeter} noValidate className="mt-8 max-w-2xl space-y-10">
        {/* 1. Identificação */}
        <fieldset className="space-y-4">
          <legend className={CLASSE_LEGENDA}>Identificação</legend>

          <div>
            <label htmlFor="produto-titulo" className={CLASSE_ROTULO}>
              Título
            </label>
            <input
              id="produto-titulo"
              value={dados.titulo}
              onChange={(evento) => aoMudarTitulo(evento.target.value)}
              onBlur={() => tocar('titulo')}
              aria-invalid={erro('titulo') !== undefined}
              aria-describedby="erro-titulo"
              className={CLASSE_CAMPO}
            />
            <p id="erro-titulo" aria-live="polite" className={CLASSE_ERRO}>
              {erro('titulo') ?? ''}
            </p>
          </div>

          <div>
            <label htmlFor="produto-subtitulo" className={CLASSE_ROTULO}>
              Subtítulo (opcional)
            </label>
            <input
              id="produto-subtitulo"
              value={dados.subtitulo}
              onChange={(evento) => atualizar({ subtitulo: evento.target.value })}
              className={CLASSE_CAMPO}
            />
          </div>

          <div>
            <label htmlFor="produto-autores" className={CLASSE_ROTULO}>
              Autores
            </label>
            <input
              id="produto-autores"
              value={dados.autoresTexto}
              onChange={(evento) => atualizar({ autoresTexto: evento.target.value })}
              onBlur={() => tocar('autores')}
              placeholder="Separe vários por vírgula"
              aria-invalid={erro('autores') !== undefined}
              aria-describedby="erro-autores"
              className={CLASSE_CAMPO}
            />
            <p id="erro-autores" aria-live="polite" className={CLASSE_ERRO}>
              {erro('autores') ?? ''}
            </p>
          </div>

          <div>
            <label htmlFor="produto-slug" className={CLASSE_ROTULO}>
              Slug
            </label>
            <input
              id="produto-slug"
              value={dados.slug}
              onChange={(evento) => aoMudarSlug(evento.target.value)}
              onBlur={() => tocar('slug')}
              aria-invalid={erro('slug') !== undefined}
              aria-describedby={editando ? 'erro-slug aviso-slug' : 'erro-slug'}
              className={`${CLASSE_CAMPO} font-mono`}
            />
            <p id="erro-slug" aria-live="polite" className={CLASSE_ERRO}>
              {erro('slug') ?? ''}
            </p>
            {editando && produtoExistente !== undefined && (
              <p id="aviso-slug" className="mt-1 text-xs leading-relaxed text-grafite">
                Já publicado em <span className="font-mono">/produto/{produtoExistente.slug}</span>.
                Mudar o slug muda esse endereço — links e favoritos antigos param de funcionar.
              </p>
            )}
          </div>

          <fieldset>
            <legend className={CLASSE_ROTULO}>Tipo</legend>
            <div className="mt-2 space-y-1">
              {TIPOS.map((tipo) => (
                <label key={tipo.valor} htmlFor={`produto-tipo-${tipo.valor}`} className={CLASSE_ITEM_CAIXA}>
                  <input
                    type="radio"
                    id={`produto-tipo-${tipo.valor}`}
                    name="tipo"
                    checked={dados.tipo === tipo.valor}
                    onChange={() => atualizar({ tipo: tipo.valor })}
                    className="h-4 w-4 shrink-0 rounded-[9999px] border border-grafite/50 accent-azul"
                  />
                  {tipo.rotulo}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="produto-imagem" className={CLASSE_ROTULO}>
              URL da capa (opcional)
            </label>
            <input
              id="produto-imagem"
              value={dados.imagemUrl}
              onChange={(evento) => atualizar({ imagemUrl: evento.target.value })}
              className={CLASSE_CAMPO}
            />
          </div>

          <label htmlFor="produto-destaque" className={CLASSE_ITEM_CAIXA}>
            <input
              type="checkbox"
              id="produto-destaque"
              checked={dados.destaque}
              onChange={(evento) => atualizar({ destaque: evento.target.checked })}
              className={CLASSE_CAIXA}
            />
            Produto em destaque
          </label>
        </fieldset>

        {/* 2. Categorias e tags */}
        <fieldset className="space-y-4">
          <legend className={CLASSE_LEGENDA}>Categorias e assuntos</legend>

          <fieldset>
            <legend className={CLASSE_ROTULO}>Categorias</legend>
            <ul className="mt-2">
              {categorias.map((categoria) => (
                <li key={categoria.id}>
                  <label htmlFor={`produto-categoria-${categoria.id}`} className={CLASSE_ITEM_CAIXA}>
                    <input
                      type="checkbox"
                      id={`produto-categoria-${categoria.id}`}
                      checked={dados.categoriaIds.includes(categoria.id)}
                      onChange={() =>
                        atualizar({ categoriaIds: alternarEmLista(dados.categoriaIds, categoria.id) })
                      }
                      className={CLASSE_CAIXA}
                    />
                    {categoria.nome}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <div>
            <label htmlFor="produto-tags" className={CLASSE_ROTULO}>
              Tags (opcional)
            </label>
            <input
              id="produto-tags"
              value={dados.tagsTexto}
              onChange={(evento) => atualizar({ tagsTexto: evento.target.value })}
              placeholder="Separe várias por vírgula"
              className={CLASSE_CAMPO}
            />
          </div>
        </fieldset>

        {/* 3. Preço */}
        <fieldset className="space-y-4">
          <legend className={CLASSE_LEGENDA}>Preço</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="produto-preco" className={CLASSE_ROTULO}>
                Preço (R$)
              </label>
              <input
                id="produto-preco"
                inputMode="decimal"
                value={dados.precoReais}
                onChange={(evento) => atualizar({ precoReais: evento.target.value })}
                onBlur={() => tocar('preco')}
                placeholder="0,00"
                aria-invalid={erro('preco') !== undefined}
                aria-describedby="erro-preco"
                className={`${CLASSE_CAMPO} font-mono`}
              />
              <p id="erro-preco" aria-live="polite" className={CLASSE_ERRO}>
                {erro('preco') ?? ''}
              </p>
            </div>

            <div>
              <label htmlFor="produto-preco-promo" className={CLASSE_ROTULO}>
                Preço promocional (opcional)
              </label>
              <input
                id="produto-preco-promo"
                inputMode="decimal"
                value={dados.precoPromocionalReais}
                onChange={(evento) => atualizar({ precoPromocionalReais: evento.target.value })}
                onBlur={() => tocar('precoPromocional')}
                placeholder="0,00"
                aria-invalid={erro('precoPromocional') !== undefined}
                aria-describedby="erro-preco-promo"
                className={`${CLASSE_CAMPO} font-mono`}
              />
              <p id="erro-preco-promo" aria-live="polite" className={CLASSE_ERRO}>
                {erro('precoPromocional') ?? ''}
              </p>
            </div>
          </div>
        </fieldset>

        {/* 4. Campos por tipo */}
        {dados.tipo === 'ebook' ? (
          <fieldset>
            <legend className={CLASSE_LEGENDA}>Formatos</legend>
            <div className="mt-2 space-y-1">
              {FORMATOS.map((formato) => (
                <label key={formato.valor} htmlFor={`produto-formato-${formato.valor}`} className={CLASSE_ITEM_CAIXA}>
                  <input
                    type="checkbox"
                    id={`produto-formato-${formato.valor}`}
                    checked={dados.formatos.includes(formato.valor)}
                    onChange={() => {
                      tocar('formatos');
                      atualizar({ formatos: alternarEmLista(dados.formatos, formato.valor) });
                    }}
                    className={CLASSE_CAIXA}
                  />
                  {formato.rotulo}
                </label>
              ))}
            </div>
            <p aria-live="polite" className={CLASSE_ERRO}>
              {erro('formatos') ?? ''}
            </p>
          </fieldset>
        ) : (
          <fieldset className="space-y-4">
            <legend className={CLASSE_LEGENDA}>Estoque e envio</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="produto-estoque" className={CLASSE_ROTULO}>
                  Estoque (unidades)
                </label>
                <input
                  id="produto-estoque"
                  inputMode="numeric"
                  value={dados.estoqueTexto}
                  onChange={(evento) => atualizar({ estoqueTexto: evento.target.value })}
                  onBlur={() => tocar('estoque')}
                  aria-invalid={erro('estoque') !== undefined}
                  aria-describedby="erro-estoque"
                  className={`${CLASSE_CAMPO} font-mono`}
                />
                <p id="erro-estoque" aria-live="polite" className={CLASSE_ERRO}>
                  {erro('estoque') ?? ''}
                </p>
              </div>

              <div>
                <label htmlFor="produto-peso" className={CLASSE_ROTULO}>
                  Peso (gramas)
                </label>
                <input
                  id="produto-peso"
                  inputMode="numeric"
                  value={dados.pesoTexto}
                  onChange={(evento) => atualizar({ pesoTexto: evento.target.value })}
                  onBlur={() => tocar('peso')}
                  aria-invalid={erro('peso') !== undefined}
                  aria-describedby="erro-peso"
                  className={`${CLASSE_CAMPO} font-mono`}
                />
                <p id="erro-peso" aria-live="polite" className={CLASSE_ERRO}>
                  {erro('peso') ?? ''}
                </p>
              </div>
            </div>
          </fieldset>
        )}

        {dados.tipo === 'kit' && (
          <fieldset>
            <legend className={CLASSE_LEGENDA}>Itens do kit (mínimo dois)</legend>
            <ul className="mt-2 max-h-64 divide-y divide-grafite/20 overflow-y-auto border-y border-grafite/20">
              {produtos
                .filter((produto) => produto.id !== idAtual)
                .map((produto) => (
                  <li key={produto.id}>
                    <label htmlFor={`produto-item-kit-${produto.id}`} className={`${CLASSE_ITEM_CAIXA} justify-between py-2`}>
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`produto-item-kit-${produto.id}`}
                          checked={dados.itensDoKit.includes(produto.id)}
                          onChange={() => {
                            tocar('itensDoKit');
                            atualizar({ itensDoKit: alternarEmLista(dados.itensDoKit, produto.id) });
                          }}
                          className={CLASSE_CAIXA}
                        />
                        {produto.titulo}
                      </span>
                      <span className="font-mono text-xs text-grafite">{produto.tipo}</span>
                    </label>
                  </li>
                ))}
            </ul>
            <p aria-live="polite" className={CLASSE_ERRO}>
              {erro('itensDoKit') ?? ''}
            </p>
          </fieldset>
        )}

        {/* 5. Ficha catalográfica — não existe para kit */}
        {dados.tipo !== 'kit' && (
          <fieldset className="space-y-4">
            <legend className={CLASSE_LEGENDA}>Ficha catalográfica (opcional)</legend>
            <p className="text-xs leading-relaxed text-grafite">
              Preencha todos os campos, ou deixe todos em branco — meia ficha não entra.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ficha-isbn" className={CLASSE_ROTULO}>
                  ISBN
                </label>
                <input
                  id="ficha-isbn"
                  value={dados.ficha.isbn}
                  onChange={(evento) => atualizarFicha({ isbn: evento.target.value })}
                  onBlur={() => tocar('ficha')}
                  className={`${CLASSE_CAMPO} font-mono`}
                />
              </div>
              <div>
                <label htmlFor="ficha-edicao" className={CLASSE_ROTULO}>
                  Edição
                </label>
                <input
                  id="ficha-edicao"
                  value={dados.ficha.edicao}
                  onChange={(evento) => atualizarFicha({ edicao: evento.target.value })}
                  onBlur={() => tocar('ficha')}
                  className={CLASSE_CAMPO}
                />
              </div>
              <div>
                <label htmlFor="ficha-ano" className={CLASSE_ROTULO}>
                  Ano
                </label>
                <input
                  id="ficha-ano"
                  inputMode="numeric"
                  value={dados.ficha.anoTexto}
                  onChange={(evento) => atualizarFicha({ anoTexto: evento.target.value })}
                  onBlur={() => tocar('ficha')}
                  className={`${CLASSE_CAMPO} font-mono`}
                />
              </div>
              <div>
                <label htmlFor="ficha-paginas" className={CLASSE_ROTULO}>
                  Páginas
                </label>
                <input
                  id="ficha-paginas"
                  inputMode="numeric"
                  value={dados.ficha.paginasTexto}
                  onChange={(evento) => atualizarFicha({ paginasTexto: evento.target.value })}
                  onBlur={() => tocar('ficha')}
                  className={`${CLASSE_CAMPO} font-mono`}
                />
              </div>
              <div>
                <label htmlFor="ficha-idioma" className={CLASSE_ROTULO}>
                  Idioma
                </label>
                <input
                  id="ficha-idioma"
                  value={dados.ficha.idioma}
                  onChange={(evento) => atualizarFicha({ idioma: evento.target.value })}
                  onBlur={() => tocar('ficha')}
                  className={CLASSE_CAMPO}
                />
              </div>
              <div>
                <label htmlFor="ficha-cdu" className={CLASSE_ROTULO}>
                  CDU
                </label>
                <input
                  id="ficha-cdu"
                  value={dados.ficha.cdu}
                  onChange={(evento) => atualizarFicha({ cdu: evento.target.value })}
                  onBlur={() => tocar('ficha')}
                  className={`${CLASSE_CAMPO} font-mono`}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ficha-editora" className={CLASSE_ROTULO}>
                  Editora
                </label>
                <input
                  id="ficha-editora"
                  value={dados.ficha.editora}
                  onChange={(evento) => atualizarFicha({ editora: evento.target.value })}
                  onBlur={() => tocar('ficha')}
                  className={CLASSE_CAMPO}
                />
              </div>
            </div>
            <p aria-live="polite" className={CLASSE_ERRO}>
              {erro('ficha') ?? ''}
            </p>
          </fieldset>
        )}

        {/* 6. Descrição */}
        <div>
          <label htmlFor="produto-descricao" className={CLASSE_ROTULO}>
            Descrição
          </label>
          <textarea
            id="produto-descricao"
            value={dados.descricao}
            onChange={(evento) => atualizar({ descricao: evento.target.value })}
            rows={5}
            className={CLASSE_CAMPO}
          />
        </div>

        {tentouSalvar && Object.keys(erros).length > 0 && (
          <p role="alert" className="border-l-2 border-ocre bg-white px-4 py-3 text-sm leading-relaxed text-tinta">
            Há campos para corrigir antes de salvar.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t border-grafite/20 pt-6">
          <button
            type="submit"
            className="bg-azul px-6 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
          >
            {editando ? 'Salvar alterações' : 'Cadastrar produto'}
          </button>
          <Link to="/admin/produtos" className="font-display text-sm text-azul hover:underline">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ProdutoFormulario;
