import { carregarModulo, criarPlacar } from './arnes.mjs';

const lib = await carregarModulo('src/lib/produtoFormulario.ts', 'produtoFormulario');
const { produtos } = await carregarModulo('src/mocks/produtos.ts', 'produtosMockParaFormulario');

const { conferir, secao, encerrar } = criarPlacar();

const p = (id) => produtos.find((x) => x.id === id);

/* ============ 1. gerarSlug ============ */
secao('gerarSlug');
conferir('titulo simples', lib.gerarSlug('Fundamentos de Aprendizado Profundo'), 'fundamentos-de-aprendizado-profundo');
conferir('acentos removidos', lib.gerarSlug('Segurança de Modelos de Linguagem'), 'seguranca-de-modelos-de-linguagem');
conferir('espacos extras colapsam', lib.gerarSlug('  Título   com espaços  '), 'titulo-com-espacos');
conferir('pontuacao vira hifen unico', lib.gerarSlug('C++: Além do Básico!'), 'c-alem-do-basico');
conferir('vazio', lib.gerarSlug(''), '');

/* ============ 1b. proximoSlugAoMudarTitulo ============ */
secao('proximoSlugAoMudarTitulo');
conferir(
  'produto novo (slug ainda nao tocado): sugere a partir do titulo',
  lib.proximoSlugAoMudarTitulo('Fundamentos de Aprendizado Profundo', '', false),
  'fundamentos-de-aprendizado-profundo',
);
conferir(
  'editar o titulo de um produto existente NAO regenera o slug publicado',
  lib.proximoSlugAoMudarTitulo(
    'Fundamentos de Aprendizado Profundo — Edição Revisada',
    'fundamentos-de-aprendizado-profundo',
    true,
  ),
  'fundamentos-de-aprendizado-profundo',
);
conferir(
  'slug tocado a mao (mesmo em produto novo) tambem para de seguir o titulo',
  lib.proximoSlugAoMudarTitulo('Outro Titulo Qualquer', 'slug-escolhido-a-mao', true),
  'slug-escolhido-a-mao',
);

/* ============ 2. centavosParaReaisTexto ============ */
secao('centavosParaReaisTexto');
conferir('15900', lib.centavosParaReaisTexto(15900), '159,00');
conferir('990', lib.centavosParaReaisTexto(990), '9,90');
conferir('0', lib.centavosParaReaisTexto(0), '0,00');

/* ============ 3. gerarIdDeProduto ============ */
secao('gerarIdDeProduto');
conferir('a partir dos 10 mocks', lib.gerarIdDeProduto(produtos), 'prod-011');
conferir('lista vazia', lib.gerarIdDeProduto([]), 'prod-001');
conferir('pega o maior, nao o ultimo', lib.gerarIdDeProduto([{ id: 'prod-005' }, { id: 'prod-002' }]), 'prod-006');
conferir('id malformado e ignorado', lib.gerarIdDeProduto([{ id: 'prod-abc' }, { id: 'prod-003' }]), 'prod-004');

/* ============ 4. paraDadosDoFormulario (ida) ============ */
secao('paraDadosDoFormulario');
const dadosDoFisico = lib.paraDadosDoFormulario(p('prod-001'));
conferir('titulo', dadosDoFisico.titulo, 'Fundamentos de Aprendizado Profundo');
conferir('autores juntos por virgula', dadosDoFisico.autoresTexto, 'Helena Vasconcelos, Rui Amorim');
conferir('preco em reais com centavos', dadosDoFisico.precoReais, '189,00');
conferir('promocional em reais', dadosDoFisico.precoPromocionalReais, '159,00');
conferir('estoque como texto', dadosDoFisico.estoqueTexto, '42');
conferir('ficha isbn preenchida', dadosDoFisico.ficha.isbn, '978-85-7522-101-4');

const dadosDoEbook = lib.paraDadosDoFormulario(p('prod-003'));
conferir('e-book: estoque vazio (nao "null")', dadosDoEbook.estoqueTexto, '');
conferir('e-book: sem promocional', dadosDoEbook.precoPromocionalReais, '');
conferir('e-book: formatos', dadosDoEbook.formatos, ['pdf', 'epub']);

const dadosDoKit = lib.paraDadosDoFormulario(p('prod-009'));
conferir('kit: itensDoKit', dadosDoKit.itensDoKit, ['prod-001', 'prod-002', 'prod-008']);
conferir('kit: sem ficha (fica em branco)', dadosDoKit.ficha.isbn, '');

/* ============ 5. validar ============ */
secao('validar');
conferir('formulario do prod-001 sem alteracoes: sem erro', lib.validar(dadosDoFisico, produtos, 'prod-001'), {});

const semTitulo = { ...dadosDoFisico, titulo: '  ' };
conferir('titulo vazio', Object.keys(lib.validar(semTitulo, produtos, 'prod-001')), ['titulo']);

const semAutor = { ...dadosDoFisico, autoresTexto: '   ' };
conferir('autores vazio', Object.keys(lib.validar(semAutor, produtos, 'prod-001')), ['autores']);

const slugVazio = { ...dadosDoFisico, slug: '' };
conferir('slug vazio', lib.validar(slugVazio, produtos, 'prod-001').slug, 'Digite o slug.');

const slugComEspaco = { ...dadosDoFisico, slug: 'com espaço' };
conferir('slug com espaco e invalido', Object.keys(lib.validar(slugComEspaco, produtos, 'prod-001')), ['slug']);

const slugMaiuscula = { ...dadosDoFisico, slug: 'Com-Maiuscula' };
conferir('slug com maiuscula e invalido', Object.keys(lib.validar(slugMaiuscula, produtos, 'prod-001')), ['slug']);

const slugColidindo = { ...dadosDoFisico, slug: 'arquitetura-de-sistemas-inteligentes' };
conferir(
  'slug colidindo com outro produto',
  lib.validar(slugColidindo, produtos, 'prod-001').slug,
  'Este slug já é usado por "Arquitetura de Sistemas Inteligentes".',
);
conferir(
  'slug igual ao proprio produto (editando) nao colide',
  lib.validar(dadosDoFisico, produtos, 'prod-001').slug,
  undefined,
);
conferir(
  'mesmo slug, mas criando um produto novo (idAtual null), colide',
  lib.validar(dadosDoFisico, produtos, null).slug !== undefined,
  true,
);

const precoZerado = { ...dadosDoFisico, precoReais: '0' };
conferir('preco zero e invalido', Object.keys(lib.validar(precoZerado, produtos, 'prod-001')), ['preco']);
const precoVazio = { ...dadosDoFisico, precoReais: '' };
conferir('preco vazio e invalido', Object.keys(lib.validar(precoVazio, produtos, 'prod-001')), ['preco']);
const precoTexto = { ...dadosDoFisico, precoReais: 'abc' };
conferir('preco nao-numerico e invalido', Object.keys(lib.validar(precoTexto, produtos, 'prod-001')), ['preco']);

const promoInvalida = { ...dadosDoFisico, precoPromocionalReais: 'abc' };
conferir('promocional invalido quando preenchido', Object.keys(lib.validar(promoInvalida, produtos, 'prod-001')), ['precoPromocional']);
const promoVazia = { ...dadosDoFisico, precoPromocionalReais: '' };
conferir('promocional vazio nao e erro (opcional)', lib.validar(promoVazia, produtos, 'prod-001').precoPromocional, undefined);

const fisicoSemEstoque = { ...dadosDoFisico, estoqueTexto: '' };
conferir('fisico sem estoque', Object.keys(lib.validar(fisicoSemEstoque, produtos, 'prod-001')), ['estoque']);
const fisicoEstoqueNegativo = { ...dadosDoFisico, estoqueTexto: '-1' };
conferir('fisico com estoque negativo', Object.keys(lib.validar(fisicoEstoqueNegativo, produtos, 'prod-001')), ['estoque']);
const fisicoSemPeso = { ...dadosDoFisico, pesoTexto: '0' };
conferir('fisico com peso zero e invalido', Object.keys(lib.validar(fisicoSemPeso, produtos, 'prod-001')), ['peso']);

const ebookSemFormato = { ...dadosDoEbook, formatos: [] };
conferir('ebook sem formato', Object.keys(lib.validar(ebookSemFormato, produtos, 'prod-003')), ['formatos']);
conferir('ebook nao exige estoque nem peso', lib.validar(ebookSemFormato, produtos, 'prod-003').estoque, undefined);

const kitComUmItem = { ...dadosDoKit, itensDoKit: ['prod-001'] };
conferir('kit com 1 item so', Object.keys(lib.validar(kitComUmItem, produtos, 'prod-009')), ['itensDoKit']);
const kitComItemFantasma = { ...dadosDoKit, itensDoKit: ['prod-001', 'zzz'] };
conferir('kit com item inexistente', Object.keys(lib.validar(kitComItemFantasma, produtos, 'prod-009')), ['itensDoKit']);
conferir('kit com dois itens validos: sem erro', lib.validar(dadosDoKit, produtos, 'prod-009'), {});

const fichaMeia = { ...dadosDoFisico, ficha: { ...dadosDoFisico.ficha, edicao: '' } };
conferir('ficha meio preenchida', Object.keys(lib.validar(fichaMeia, produtos, 'prod-001')), ['ficha']);
const fichaVaziaInteira = {
  ...dadosDoFisico,
  ficha: { isbn: '', edicao: '', anoTexto: '', paginasTexto: '', idioma: '', cdu: '', editora: '' },
};
conferir('ficha inteiramente vazia e opcional, sem erro', lib.validar(fichaVaziaInteira, produtos, 'prod-001'), {});
const fichaAnoInvalido = { ...dadosDoFisico, ficha: { ...dadosDoFisico.ficha, anoTexto: 'ano' } };
conferir('ficha com ano invalido', Object.keys(lib.validar(fichaAnoInvalido, produtos, 'prod-001')), ['ficha']);

const kitComFicha = { ...dadosDoKit, ficha: dadosDoFisico.ficha };
conferir('kit ignora ficha na validacao (nao e erro)', lib.validar(kitComFicha, produtos, 'prod-009'), {});

/* ============ 6. montarProduto ============ */
secao('montarProduto');
const contexto = { id: 'prod-001', criadoEm: p('prod-001').criadoEm };
const remontado = lib.montarProduto(dadosDoFisico, contexto);
conferir('ida e volta preserva o produto fisico', remontado, p('prod-001'));

const remontadoEbook = lib.montarProduto(dadosDoEbook, { id: 'prod-003', criadoEm: p('prod-003').criadoEm });
conferir('ida e volta preserva o e-book', remontadoEbook, p('prod-003'));

const remontadoKit = lib.montarProduto(dadosDoKit, { id: 'prod-009', criadoEm: p('prod-009').criadoEm });
conferir('ida e volta preserva o kit', remontadoKit, p('prod-009'));

const ebookComTextoDeEstoque = { ...dadosDoEbook, estoqueTexto: '999', pesoTexto: '500' };
const montadoIgnorandoEstoque = lib.montarProduto(ebookComTextoDeEstoque, { id: 'prod-003', criadoEm: 'x' });
conferir('e-book monta com estoque null mesmo com texto preenchido', montadoIgnorandoEstoque.estoque, null);
conferir('e-book monta com peso 0 mesmo com texto preenchido', montadoIgnorandoEstoque.peso, 0);

const kitComFichaNaMontagem = lib.montarProduto(kitComFicha, { id: 'prod-009', criadoEm: 'x' });
conferir('kit nunca ganha a chave ficha', 'ficha' in kitComFichaNaMontagem, false);

const semSubtituloNemPromo = {
  ...dadosDoFisico,
  subtitulo: '',
  precoPromocionalReais: '',
};
const montadoSemOpcionais = lib.montarProduto(semSubtituloNemPromo, contexto);
conferir('subtitulo vazio nao vira chave no objeto', 'subtitulo' in montadoSemOpcionais, false);
conferir('precoPromocional vazio nao vira chave no objeto', 'precoPromocional' in montadoSemOpcionais, false);

const semImagem = { ...dadosDoFisico, imagemUrl: '' };
conferir('sem imagem: imagens vira array vazio', lib.montarProduto(semImagem, contexto).imagens, []);

encerrar();
