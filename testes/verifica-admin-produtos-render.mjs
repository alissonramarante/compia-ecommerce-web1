import { carregarArnes, criarPlacar, idsSaoUnicos } from './arnes.mjs';

const { renderizarComProvedores } = await carregarArnes();
const { caso, secao, encerrar } = criarPlacar();

const ADMIN = { clienteId: 'cli-001', usuarioId: 'usr-001' }; // Renata, admin
const VENDEDOR = { clienteId: 'cli-001', usuarioId: 'usr-003' }; // Cláudia, vendedor
const EDITOR = { clienteId: 'cli-001', usuarioId: 'usr-002' }; // Gustavo, editor

const pagina = (rota, sessao = ADMIN) => renderizarComProvedores(rota, { sessao });

/* ============ 0. autoteste — idsSaoUnicos não é enganado nem cego ============ */
secao('autoteste — idsSaoUnicos');
caso('um id so: unico', idsSaoUnicos('<input id="produto-titulo" />'));
caso('dois ids diferentes: unico', idsSaoUnicos('<input id="a" /><input id="b" />'));
caso(
  'aria-invalid="false" nao e falso-positivo de id repetido',
  idsSaoUnicos('<input id="x" aria-invalid="false" /><input id="y" aria-invalid="false" />'),
);
caso('DETECTA duplicata de verdade', !idsSaoUnicos('<input id="dup" /><input id="dup" />'));
caso(
  'detecta duplicata mesmo com aria-describedby no meio (regressão do bug do aria-invalid)',
  !idsSaoUnicos('<input id="dup" aria-invalid="true" aria-describedby="erro-dup" /><input id="dup" />'),
);

/* ============ 1. lista: conteúdo derivado do catálogo ============ */
secao('lista — conteúdo');
const lista = pagina('/admin/produtos');
caso('titulo da pagina', lista.includes('>Produtos<'));
caso('capa em miniatura', lista.includes('width="40"') && lista.includes('height="56"'));
caso('tipo fisico', lista.includes('>Físico<'));
caso('tipo ebook', lista.includes('>E-book<'));
caso('tipo kit', lista.includes('>Kit<'));
caso('preco vigente em mono (prod-001 promocional)', lista.includes('R$ 159,00'));
caso('estoque baixo em ocre (prod-006, 3 unidades)', /text-ocre[^>]*>3</.test(lista));
caso('esgotado rotulado (prod-008)', lista.includes('>Esgotado<'));
caso('e-book mostra ilimitado (nao um numero)', lista.includes('>Ilimitado<'));
caso('produto em destaque tem marcador acessivel', lista.includes('aria-label="Produto em destaque"'));
caso('contagem de produtos', lista.includes('10 produtos'));

/* ============ 2. lista: busca e filtro por tipo (reaproveitando lib/catalogo) ============ */
secao('lista — busca e filtro');
const buscaMatematica = renderizarComProvedores('/admin/produtos?busca=matematica', { sessao: ADMIN });
caso('busca por titulo filtra', buscaMatematica.includes('1 produto') && buscaMatematica.includes('Matemática Essencial'));

const filtroEbook = renderizarComProvedores('/admin/produtos?tipo=ebook', { sessao: ADMIN });
caso('filtro por tipo ebook', filtroEbook.includes('4 produtos'));
caso('filtro por tipo nao mostra fisico', !filtroEbook.includes('Fundamentos de Aprendizado Profundo'));

const semResultado = renderizarComProvedores('/admin/produtos?busca=zzzznada', { sessao: ADMIN });
caso('sem resultado: mensagem cita o termo buscado, sem tabela', semResultado.includes('Nenhum produto para “zzzznada”.') && !semResultado.includes('<table'));
caso('sem resultado: oferece limpar filtros', semResultado.includes('Limpar filtros'));

/* ============ 3. lista: ações por perfil ============ */
secao('lista — ações por perfil');
const listaVendedor = pagina('/admin/produtos', VENDEDOR);
caso('vendedor: sem botao novo produto', !listaVendedor.includes('Novo produto'));
caso('vendedor: sem link de editar', !listaVendedor.includes('href="/admin/produtos/prod-001"'));
caso('vendedor: titulo nao e link (texto puro)', /<span[^>]*>Fundamentos de Aprendizado Profundo<\/span>/.test(listaVendedor));
caso('vendedor: ainda ve a tabela (leitura)', listaVendedor.includes('<table'));

const listaEditor = pagina('/admin/produtos', EDITOR);
caso('editor: tem botao novo produto', listaEditor.includes('Novo produto'));
caso('editor: titulo e link de edicao', listaEditor.includes('href="/admin/produtos/prod-001"'));

/* ============ 4. formulário: novo produto ============ */
secao('formulário — novo');
const novo = pagina('/admin/produtos/novo');
caso('titulo da tela', novo.includes('Novo produto'));
caso('campos vazios', novo.includes('id="produto-titulo"') && !novo.includes('value="Fundamentos'));
caso('fisico selecionado por padrao', /id="produto-tipo-fisico"[^>]*checked|checked[^>]*id="produto-tipo-fisico"/.test(novo));
caso('mostra estoque e peso (padrao fisico)', novo.includes('id="produto-estoque"') && novo.includes('id="produto-peso"'));
caso('mostra ficha catalografica (fisico)', novo.includes('Ficha catalográfica'));
caso('nao mostra formatos (so ebook)', !novo.includes('id="produto-formato-pdf"'));
caso('nao mostra itens do kit (so kit)', !novo.includes('Itens do kit'));
caso('erros comecam vazios (nada tocado)', /id="erro-titulo"[^>]*>\s*<\/p>/.test(novo));
caso('botao de cadastrar', novo.includes('Cadastrar produto'));
caso('sem ids repetidos', idsSaoUnicos(novo));
/* Erro de campo é anunciado por aria-describedby ao receber foco; a única
   região viva (o resumo no rodapé) só existe depois de tentar salvar. */
caso('sem regiao aria-live antes de tentar salvar', !novo.includes('aria-live'));
caso('campo da ficha ja referencia o erro do grupo', novo.includes('aria-describedby="erro-ficha"'));

/* ============ 5. formulário: editar físico ============ */
secao('formulário — editar físico (prod-001)');
const editarFisico = pagina('/admin/produtos/prod-001');
caso('titulo da tela mostra o produto', editarFisico.includes('Editar produto'));
caso('titulo pre-preenchido', editarFisico.includes('value="Fundamentos de Aprendizado Profundo"'));
caso('slug pre-preenchido', editarFisico.includes('value="fundamentos-de-aprendizado-profundo"'));
caso('preco em reais com centavos', editarFisico.includes('value="189,00"'));
caso('promocional preenchido', editarFisico.includes('value="159,00"'));
caso('estoque preenchido', editarFisico.includes('id="produto-estoque"') && editarFisico.includes('value="42"'));
caso('peso preenchido', editarFisico.includes('value="980"'));
caso('ficha isbn preenchida', editarFisico.includes('978-85-7522-101-4'));
caso('botao de salvar (nao cadastrar)', editarFisico.includes('Salvar alterações'));
caso('avisa que o slug ja esta publicado', editarFisico.includes('Já publicado em'));
caso('aviso cita o endereco atual', editarFisico.includes('/produto/fundamentos-de-aprendizado-profundo'));
caso('aviso diz que links antigos param de funcionar', editarFisico.includes('links e favoritos antigos param de funcionar'));
caso('campo do slug referencia o aviso no aria-describedby', editarFisico.includes('aria-describedby="erro-slug aviso-slug"'));

/* ============ 5b. formulário: criar produto novo não avisa sobre slug publicado ============ */
secao('formulário — novo não tem aviso de slug publicado');
caso('sem aviso de slug ja publicado (nada para quebrar ainda)', !novo.includes('Já publicado em'));
caso('campo do slug nao referencia aviso inexistente', novo.includes('aria-describedby="erro-slug"') && !novo.includes('aria-describedby="erro-slug aviso-slug"'));

/* ============ 6. formulário: editar e-book ============ */
secao('formulário — editar e-book (prod-003)');
const editarEbook = pagina('/admin/produtos/prod-003');
caso('mostra formatos, marcando os do produto', editarEbook.includes('id="produto-formato-pdf"') && editarEbook.includes('id="produto-formato-epub"'));
caso('nao mostra estoque nem peso (e-book)', !editarEbook.includes('id="produto-estoque"') && !editarEbook.includes('id="produto-peso"'));
caso('ainda mostra ficha catalografica (e-book tem ficha no mock)', editarEbook.includes('Ficha catalográfica'));
caso('checkbox de formato referencia o erro do grupo', editarEbook.includes('aria-describedby="erro-formatos"'));
caso('grupo de formatos tem id proprio', editarEbook.includes('id="erro-formatos"'));
caso('sem ids repetidos', idsSaoUnicos(editarEbook));

/* ============ 7. formulário: editar kit ============ */
secao('formulário — editar kit (prod-009)');
const editarKit = pagina('/admin/produtos/prod-009');
caso('mostra itens do kit', editarKit.includes('Itens do kit'));
caso('kit nao mostra ficha catalografica', !editarKit.includes('Ficha catalográfica'));
caso('kit mostra estoque e peso (tambem despacha)', editarKit.includes('id="produto-estoque"') && editarKit.includes('id="produto-peso"'));
caso('o proprio kit nao aparece na lista de itens selecionaveis', !editarKit.includes('id="produto-item-kit-prod-009"'));
caso('itens do kit vem marcados', editarKit.includes('id="produto-item-kit-prod-001"'));
caso('checkbox de item do kit referencia o erro do grupo', editarKit.includes('aria-describedby="erro-itens-kit"'));
caso('grupo de itens do kit tem id proprio', editarKit.includes('id="erro-itens-kit"'));
caso('sem ids repetidos', idsSaoUnicos(editarKit));

/* ============ 8. formulário: produto inexistente ============ */
secao('formulário — produto inexistente');
const inexistente = pagina('/admin/produtos/prod-999');
caso('mensagem propria', inexistente.includes('Não encontramos este produto.'));
caso('link de volta', inexistente.includes('href="/admin/produtos"'));
caso('nao renderiza formulario', !inexistente.includes('<form'));

encerrar();
