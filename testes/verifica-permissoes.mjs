import { carregarModulo, criarPlacar } from './arnes.mjs';

const lib = await carregarModulo('src/lib/permissoes.ts', 'permissoes');

const { conferir, secao, encerrar } = criarPlacar();

/* ============ 1. podeVer ============ */
secao('podeVer');
conferir('admin ve produtos', lib.podeVer('admin', 'produtos'), true);
conferir('admin ve pedidos', lib.podeVer('admin', 'pedidos'), true);
conferir('admin ve clientes', lib.podeVer('admin', 'clientes'), true);
conferir('admin ve logs', lib.podeVer('admin', 'logs'), true);

conferir('editor ve produtos', lib.podeVer('editor', 'produtos'), true);
conferir('editor nao ve pedidos', lib.podeVer('editor', 'pedidos'), false);
conferir('editor nao ve clientes', lib.podeVer('editor', 'clientes'), false);
conferir('editor nao ve logs', lib.podeVer('editor', 'logs'), false);

conferir('vendedor ve produtos (leitura)', lib.podeVer('vendedor', 'produtos'), true);
conferir('vendedor ve pedidos', lib.podeVer('vendedor', 'pedidos'), true);
conferir('vendedor ve clientes', lib.podeVer('vendedor', 'clientes'), true);
conferir('vendedor nao ve logs', lib.podeVer('vendedor', 'logs'), false);

/* ============ 2. podeEditar ============ */
secao('podeEditar');
conferir('admin edita tudo', ['produtos', 'pedidos', 'clientes', 'logs'].every((a) => lib.podeEditar('admin', a)), true);

conferir('editor edita produtos', lib.podeEditar('editor', 'produtos'), true);
conferir('editor nao edita pedidos', lib.podeEditar('editor', 'pedidos'), false);
conferir('editor nao edita clientes', lib.podeEditar('editor', 'clientes'), false);
conferir('editor nao edita logs', lib.podeEditar('editor', 'logs'), false);

conferir('vendedor NAO edita produtos (so leitura)', lib.podeEditar('vendedor', 'produtos'), false);
conferir('vendedor edita pedidos', lib.podeEditar('vendedor', 'pedidos'), true);
conferir('vendedor edita clientes', lib.podeEditar('vendedor', 'clientes'), true);
conferir('vendedor nao edita logs', lib.podeEditar('vendedor', 'logs'), false);

/* ============ 3. areasVisiveis ============ */
secao('areasVisiveis');
conferir('admin enxerga as quatro', lib.areasVisiveis('admin'), ['produtos', 'pedidos', 'clientes', 'logs']);
conferir('editor enxerga so produtos', lib.areasVisiveis('editor'), ['produtos']);
conferir('vendedor enxerga tres, sem logs', lib.areasVisiveis('vendedor'), ['produtos', 'pedidos', 'clientes']);

/* ============ 4. consistencia da matriz ============ */
secao('consistencia');
conferir(
  'podeEditar nunca e true onde podeVer e false',
  lib.AREAS_ADMIN.every((area) =>
    ['admin', 'editor', 'vendedor'].every((perfil) => !lib.podeEditar(perfil, area) || lib.podeVer(perfil, area)),
  ),
  true,
);
conferir('ROTULO_DE_AREA cobre as quatro areas', lib.AREAS_ADMIN.every((area) => typeof lib.ROTULO_DE_AREA[area] === 'string'), true);

encerrar();
