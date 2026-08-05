import type { PerfilUsuario } from '../types';

/**
 * Controle de acesso do painel administrativo. Puro: sem sessão, sem rota —
 * só a matriz de perfil × área, testável sem React.
 *
 * A matriz vem da especificação (seção "Permissões" do CLAUDE.md), não é
 * descoberta em runtime:
 *   admin     — tudo.
 *   editor    — produtos (e categorias, que não é rota própria). Sem
 *               pedidos nem logs.
 *   vendedor  — pedidos e clientes. Produtos só leitura, sem edição.
 */

export type AreaAdmin = 'produtos' | 'pedidos' | 'clientes' | 'logs';

export const AREAS_ADMIN: readonly AreaAdmin[] = ['produtos', 'pedidos', 'clientes', 'logs'];

export const ROTULO_DE_AREA: Record<AreaAdmin, string> = {
  produtos: 'Produtos',
  pedidos: 'Pedidos',
  clientes: 'Clientes',
  logs: 'Logs',
};

interface Permissao {
  ver: boolean;
  editar: boolean;
}

const MATRIZ: Record<PerfilUsuario, Record<AreaAdmin, Permissao>> = {
  admin: {
    produtos: { ver: true, editar: true },
    pedidos: { ver: true, editar: true },
    clientes: { ver: true, editar: true },
    logs: { ver: true, editar: true },
  },
  editor: {
    produtos: { ver: true, editar: true },
    pedidos: { ver: false, editar: false },
    clientes: { ver: false, editar: false },
    logs: { ver: false, editar: false },
  },
  vendedor: {
    produtos: { ver: true, editar: false },
    pedidos: { ver: true, editar: true },
    clientes: { ver: true, editar: true },
    logs: { ver: false, editar: false },
  },
};

/**
 * Testes de mesa:
 *   podeVer('admin', 'logs')        → true
 *   podeVer('editor', 'produtos')   → true
 *   podeVer('editor', 'pedidos')    → false
 *   podeVer('editor', 'logs')       → false
 *   podeVer('vendedor', 'produtos') → true (leitura)
 *   podeVer('vendedor', 'pedidos')  → true
 *   podeVer('vendedor', 'logs')     → false
 */
export function podeVer(perfil: PerfilUsuario, area: AreaAdmin): boolean {
  return MATRIZ[perfil][area].ver;
}

/**
 * Testes de mesa:
 *   podeEditar('admin', 'produtos')    → true
 *   podeEditar('editor', 'produtos')   → true
 *   podeEditar('editor', 'pedidos')    → false (nem enxerga a área)
 *   podeEditar('vendedor', 'produtos') → false (só leitura)
 *   podeEditar('vendedor', 'pedidos')  → true
 *   podeEditar('vendedor', 'clientes') → true
 */
export function podeEditar(perfil: PerfilUsuario, area: AreaAdmin): boolean {
  return MATRIZ[perfil][area].editar;
}

/**
 * Áreas que o perfil enxerga, na ordem de `AREAS_ADMIN`. Alimenta tanto o
 * menu do painel (o que aparece) quanto a mensagem de acesso negado (o que a
 * pessoa alcança, para não ser só "não" sem saída).
 *
 * Testes de mesa:
 *   areasVisiveis('admin')    → ['produtos','pedidos','clientes','logs']
 *   areasVisiveis('editor')   → ['produtos']
 *   areasVisiveis('vendedor') → ['produtos','pedidos','clientes']
 */
export function areasVisiveis(perfil: PerfilUsuario): AreaAdmin[] {
  return AREAS_ADMIN.filter((area) => podeVer(perfil, area));
}
