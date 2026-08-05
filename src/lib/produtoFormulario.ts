import type { FichaCatalografica, FormatoEbook, Produto, TipoProduto } from '../types';
import { normalizarTexto } from './catalogo';

/**
 * Mecânica do formulário de produto (criar e editar são o mesmo formulário).
 * Puro: nada aqui toca `localStorage`, contexto ou JSX — a página só lê o
 * mapa de erros e monta o `Produto` pronto para `salvarProduto`.
 *
 * Dinheiro entra em reais, como a pessoa digita ("159,00"), e sai em
 * centavos, como o domínio guarda. A conversão acontece na fronteira,
 * igual ao filtro de preço do catálogo.
 */

export interface DadosDaFicha {
  isbn: string;
  edicao: string;
  anoTexto: string;
  paginasTexto: string;
  idioma: string;
  cdu: string;
  editora: string;
}

export interface DadosDoFormulario {
  titulo: string;
  subtitulo: string;
  /** Separados por vírgula, como digitado. */
  autoresTexto: string;
  tipo: TipoProduto;
  categoriaIds: string[];
  /** Separadas por vírgula. */
  tagsTexto: string;
  precoReais: string;
  precoPromocionalReais: string;
  /** Vazio para e-book: o campo nem aparece no formulário. */
  estoqueTexto: string;
  /** Vazio para e-book: forçado a 0 na montagem. */
  pesoTexto: string;
  imagemUrl: string;
  descricao: string;
  slug: string;
  destaque: boolean;
  /** Só para e-book. */
  formatos: FormatoEbook[];
  /** Só para kit. */
  itensDoKit: string[];
  /** Meia ficha não entra — ver `validar`. Kit não tem ficha. */
  ficha: DadosDaFicha;
}

export type ErrosDoFormulario = Partial<
  Record<
    | 'titulo'
    | 'autores'
    | 'slug'
    | 'preco'
    | 'precoPromocional'
    | 'estoque'
    | 'peso'
    | 'formatos'
    | 'itensDoKit'
    | 'ficha',
    string
  >
>;

export const FORMULARIO_EM_BRANCO: DadosDoFormulario = {
  titulo: '',
  subtitulo: '',
  autoresTexto: '',
  tipo: 'fisico',
  categoriaIds: [],
  tagsTexto: '',
  precoReais: '',
  precoPromocionalReais: '',
  estoqueTexto: '',
  pesoTexto: '',
  imagemUrl: '',
  descricao: '',
  slug: '',
  destaque: false,
  formatos: [],
  itensDoKit: [],
  ficha: { isbn: '', edicao: '', anoTexto: '', paginasTexto: '', idioma: '', cdu: '', editora: '' },
};

/* ------------------------------------------------------------------ */
/* 1. Conversões de fronteira                                          */
/* ------------------------------------------------------------------ */

/**
 * Slug sugerido a partir do título — sem acento, minúsculo, hífen no lugar
 * de qualquer sequência que não seja letra ou número. Só uma sugestão: o
 * campo continua editável, e um slug já salvo não é regerado sozinho.
 *
 * Testes de mesa:
 *   gerarSlug('Fundamentos de Aprendizado Profundo') → 'fundamentos-de-aprendizado-profundo'
 *   gerarSlug('Segurança de Modelos de Linguagem')   → 'seguranca-de-modelos-de-linguagem'
 *   gerarSlug('  Título   com espaços  ')            → 'titulo-com-espacos'
 *   gerarSlug('C++: Além do Básico!')                → 'c-alem-do-basico'
 *   gerarSlug('')                                    → ''
 */
export function gerarSlug(titulo: string): string {
  return normalizarTexto(titulo)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Decide o slug ao digitar um novo título. Sugerir automaticamente vale só
 * enquanto o campo de slug não foi tocado à mão — ao editar um produto que
 * já existe, o slug entra tocado desde o começo (é dado publicado, não
 * rascunho), então mudar o título nunca regenera e quebra
 * `/produto/algum-slug-publicado`. Regenerar é privilégio de produto novo,
 * que ainda não tem URL para quebrar.
 *
 * Testes de mesa:
 *   slug ainda não tocado (produto novo)  → sugere a partir do título
 *   slug já tocado (produto existente, ou editado à mão) → intacto
 */
export function proximoSlugAoMudarTitulo(
  tituloNovo: string,
  slugAtual: string,
  slugTocado: boolean,
): string {
  return slugTocado ? slugAtual : gerarSlug(tituloNovo);
}

function paraLista(texto: string): string[] {
  return texto
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

/** `null` quando vazio ou inválido — usado tanto na validação quanto na montagem. */
function paraCentavos(texto: string): number | null {
  const normalizado = texto.trim().replace(',', '.');
  if (normalizado === '') return null;

  const numero = Number(normalizado);
  if (!Number.isFinite(numero) || numero < 0) return null;

  return Math.round(numero * 100);
}

/** Inteiro não negativo. Texto vazio é inválido — quem quer "sem valor" usa `''` antes de chamar. */
function paraInteiro(texto: string): number | null {
  const limpo = texto.trim();
  if (limpo === '') return null;

  const numero = Number(limpo);
  if (!Number.isInteger(numero) || numero < 0) return null;

  return numero;
}

/**
 * Testes de mesa:
 *   centavosParaReaisTexto(15900) → '159,00'
 *   centavosParaReaisTexto(990)   → '9,90'
 *   centavosParaReaisTexto(0)     → '0,00'
 */
export function centavosParaReaisTexto(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',');
}

/** Converte um `Produto` existente nos dados do formulário, para a tela de edição. */
export function paraDadosDoFormulario(produto: Produto): DadosDoFormulario {
  return {
    titulo: produto.titulo,
    subtitulo: produto.subtitulo ?? '',
    autoresTexto: produto.autores.join(', '),
    tipo: produto.tipo,
    categoriaIds: produto.categoriaIds,
    tagsTexto: produto.tags.join(', '),
    precoReais: centavosParaReaisTexto(produto.preco),
    precoPromocionalReais:
      produto.precoPromocional === undefined ? '' : centavosParaReaisTexto(produto.precoPromocional),
    estoqueTexto: produto.estoque === null ? '' : String(produto.estoque),
    pesoTexto: String(produto.peso),
    imagemUrl: produto.imagens[0] ?? '',
    descricao: produto.descricao,
    slug: produto.slug,
    destaque: produto.destaque,
    formatos: produto.formatos ?? [],
    itensDoKit: produto.itensDoKit ?? [],
    ficha: {
      isbn: produto.ficha?.isbn ?? '',
      edicao: produto.ficha?.edicao ?? '',
      anoTexto: produto.ficha === undefined ? '' : String(produto.ficha.ano),
      paginasTexto: produto.ficha === undefined ? '' : String(produto.ficha.paginas),
      idioma: produto.ficha?.idioma ?? '',
      cdu: produto.ficha?.cdu ?? '',
      editora: produto.ficha?.editora ?? '',
    },
  };
}

/* ------------------------------------------------------------------ */
/* 2. Identificação                                                    */
/* ------------------------------------------------------------------ */

/**
 * Sequencial a partir do maior `prod-NNN` já usado — espelha
 * `gerarNumeroPedido`, sem ano: produto não é particionado por período.
 *
 * Testes de mesa:
 *   gerarIdDeProduto(produtos)                          → 'prod-011' (mocks vão até prod-010)
 *   gerarIdDeProduto([])                                → 'prod-001'
 *   gerarIdDeProduto([{id:'prod-005'},{id:'prod-002'}]) → 'prod-006'
 *   id malformado ('prod-abc') é ignorado
 */
export function gerarIdDeProduto(produtos: { id: string }[]): string {
  const maior = produtos.reduce((maximo, produto) => {
    const combinacao = /^prod-(\d+)$/.exec(produto.id);
    if (combinacao === null) return maximo;

    return Math.max(maximo, Number(combinacao[1]));
  }, 0);

  return `prod-${String(maior + 1).padStart(3, '0')}`;
}

/* ------------------------------------------------------------------ */
/* 3. Validação                                                        */
/* ------------------------------------------------------------------ */

const SLUG_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Valida os dados do formulário e devolve o erro de cada campo — o
 * componente só lê o mapa e decora o `<label>` certo, nunca decide regra.
 *
 * `produtosExistentes` serve à checagem de slug único e à checagem de que
 * `itensDoKit` aponta para produtos que existem de verdade. `idAtual` exclui
 * o próprio produto dessas duas checagens, ao editar — sem isso, editar um
 * produto sem mudar nada acusaria colisão de slug consigo mesmo.
 *
 * Testes de mesa (contra os 10 produtos do mock):
 *   formulário do prod-001 sem alterações       → {} (nenhum erro)
 *   título vazio                                → erro em titulo
 *   autores vazio                                → erro em autores
 *   slug vazio                                  → erro em slug
 *   slug com maiúscula ou espaço                → erro em slug
 *   slug igual ao de outro produto              → erro em slug, nomeando o produto
 *   slug igual ao do próprio produto (editando) → sem erro
 *   preço vazio ou zero                         → erro em preco
 *   promocional inválido (quando preenchido)    → erro em precoPromocional
 *   promocional vazio                           → sem erro (campo opcional)
 *   físico sem estoque ou sem peso              → erro em estoque e/ou peso
 *   e-book sem formato selecionado              → erro em formatos
 *   kit com só 1 item                           → erro em itensDoKit
 *   kit com item inexistente                    → erro em itensDoKit
 *   ficha com só isbn preenchido                → erro em ficha ("tudo ou nada")
 *   ficha com todos os campos                   → sem erro
 *   ficha inteira vazia                         → sem erro (é opcional)
 *   kit com dados de ficha                      → ficha ignorada, sem erro
 */
export function validar(
  dados: DadosDoFormulario,
  produtosExistentes: Produto[],
  idAtual: string | null,
): ErrosDoFormulario {
  const erros: ErrosDoFormulario = {};

  if (dados.titulo.trim() === '') {
    erros.titulo = 'Digite o título.';
  }

  if (paraLista(dados.autoresTexto).length === 0) {
    erros.autores = 'Digite pelo menos um autor. Separe vários por vírgula.';
  }

  const slug = dados.slug.trim();
  if (slug === '') {
    erros.slug = 'Digite o slug.';
  } else if (!SLUG_VALIDO.test(slug)) {
    erros.slug = 'Use só letras minúsculas, números e hífen, sem espaços.';
  } else {
    const colisao = produtosExistentes.find(
      (produto) => produto.slug === slug && produto.id !== idAtual,
    );
    if (colisao !== undefined) {
      erros.slug = `Este slug já é usado por "${colisao.titulo}".`;
    }
  }

  const precoCentavos = paraCentavos(dados.precoReais);
  if (precoCentavos === null || precoCentavos <= 0) {
    erros.preco = 'Digite um preço válido, maior que zero.';
  }

  if (dados.precoPromocionalReais.trim() !== '') {
    const promocionalCentavos = paraCentavos(dados.precoPromocionalReais);
    if (promocionalCentavos === null || promocionalCentavos <= 0) {
      erros.precoPromocional = 'Digite um preço promocional válido, maior que zero.';
    }
  }

  if (dados.tipo === 'ebook') {
    if (dados.formatos.length === 0) {
      erros.formatos = 'Selecione ao menos um formato.';
    }
  } else {
    // Físico e kit: os dois são despachados, os dois pesam e têm estoque.
    if (paraInteiro(dados.estoqueTexto) === null) {
      erros.estoque = 'Digite um estoque válido — número inteiro, 0 ou mais.';
    }

    const peso = paraInteiro(dados.pesoTexto);
    if (peso === null || peso <= 0) {
      erros.peso = 'Digite um peso válido em gramas, maior que zero.';
    }

    if (dados.tipo === 'kit') {
      const itens = dados.itensDoKit.filter((id) => id !== idAtual);

      if (itens.length < 2) {
        erros.itensDoKit = 'Selecione ao menos dois produtos para compor o kit.';
      } else if (itens.some((id) => !produtosExistentes.some((produto) => produto.id === id))) {
        erros.itensDoKit = 'Um dos produtos selecionados não existe mais.';
      }
    }
  }

  // Ficha catalográfica: tudo ou nada, e só existe fora de kit.
  if (dados.tipo !== 'kit') {
    const campos = [
      dados.ficha.isbn,
      dados.ficha.edicao,
      dados.ficha.anoTexto,
      dados.ficha.paginasTexto,
      dados.ficha.idioma,
      dados.ficha.cdu,
      dados.ficha.editora,
    ];
    const preenchidos = campos.filter((campo) => campo.trim() !== '').length;

    if (preenchidos > 0 && preenchidos < campos.length) {
      erros.ficha = 'Preencha todos os campos da ficha catalográfica, ou nenhum.';
    } else if (preenchidos === campos.length && campos.length > 0) {
      if (paraInteiro(dados.ficha.anoTexto) === null) {
        erros.ficha = 'Ano da ficha catalográfica inválido.';
      } else if (paraInteiro(dados.ficha.paginasTexto) === null) {
        erros.ficha = 'Número de páginas da ficha catalográfica inválido.';
      }
    }
  }

  return erros;
}

/* ------------------------------------------------------------------ */
/* 4. Montagem                                                         */
/* ------------------------------------------------------------------ */

/**
 * Monta o `Produto` a partir de dados já validados — chamar sem checar
 * `validar` primeiro produz um produto com valores de fallback (0, `[]`)
 * onde o campo era inválido, então a página nunca pula a validação.
 *
 * Regras de montagem, por tipo:
 *   e-book — `estoque: null`, `peso: 0`, ganha `formatos`, nunca tem `ficha`
 *            nem `itensDoKit`.
 *   kit    — nunca tem `ficha`, ganha `itensDoKit`, estoque e peso como
 *            digitados (o kit também é despachado).
 *   físico — estoque e peso como digitados, pode ter `ficha`.
 *
 * Testes de mesa:
 *   e-book monta com estoque null e peso 0, mesmo se o texto dissesse outro valor
 *   kit não carrega `ficha` mesmo com os campos preenchidos no formulário
 *   físico sem ficha preenchida não ganha a chave `ficha`
 *   subtitulo e precoPromocional vazios não entram no objeto (chave ausente, não string vazia)
 */
export function montarProduto(
  dados: DadosDoFormulario,
  contexto: { id: string; criadoEm: string },
): Produto {
  const ehEbook = dados.tipo === 'ebook';
  const ehKit = dados.tipo === 'kit';

  const precoPromocionalCentavos =
    dados.precoPromocionalReais.trim() === '' ? undefined : paraCentavos(dados.precoPromocionalReais) ?? undefined;

  const fichaCompleta: FichaCatalografica | undefined =
    !ehKit && dados.ficha.isbn.trim() !== ''
      ? {
          isbn: dados.ficha.isbn.trim(),
          edicao: dados.ficha.edicao.trim(),
          ano: paraInteiro(dados.ficha.anoTexto) ?? 0,
          paginas: paraInteiro(dados.ficha.paginasTexto) ?? 0,
          idioma: dados.ficha.idioma.trim(),
          cdu: dados.ficha.cdu.trim(),
          editora: dados.ficha.editora.trim(),
        }
      : undefined;

  return {
    id: contexto.id,
    slug: dados.slug.trim(),
    titulo: dados.titulo.trim(),
    ...(dados.subtitulo.trim() === '' ? {} : { subtitulo: dados.subtitulo.trim() }),
    autores: paraLista(dados.autoresTexto),
    tipo: dados.tipo,
    categoriaIds: dados.categoriaIds,
    tags: paraLista(dados.tagsTexto),
    preco: paraCentavos(dados.precoReais) ?? 0,
    ...(precoPromocionalCentavos === undefined ? {} : { precoPromocional: precoPromocionalCentavos }),
    estoque: ehEbook ? null : paraInteiro(dados.estoqueTexto) ?? 0,
    peso: ehEbook ? 0 : paraInteiro(dados.pesoTexto) ?? 0,
    imagens: dados.imagemUrl.trim() === '' ? [] : [dados.imagemUrl.trim()],
    descricao: dados.descricao.trim(),
    ...(fichaCompleta === undefined ? {} : { ficha: fichaCompleta }),
    ...(ehKit ? { itensDoKit: dados.itensDoKit } : {}),
    ...(ehEbook ? { formatos: dados.formatos } : {}),
    destaque: dados.destaque,
    criadoEm: contexto.criadoEm,
  };
}
