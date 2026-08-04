import type { LogAtividade } from '../types';

export { categorias } from './categorias';
export { produtos } from './produtos';
export { clientes } from './clientes';
export { usuarios } from './usuarios';
export { pedidos } from './pedidos';
export {
  tabelaFrete,
  faixaPadrao,
  limiteFreteGratis,
  fatorExpresso,
  localDeRetirada,
  chavePixLoja,
} from './frete';

/** Logs iniciais para o painel não abrir vazio. */
export const logs: LogAtividade[] = [
  {
    id: 'log-001',
    usuarioId: 'usr-002',
    acao: 'produto_criado',
    entidade: 'produto',
    entidadeId: 'prod-005',
    descricao: 'Cadastrou "Segurança de Modelos de Linguagem"',
    em: '2026-02-18T10:12:00Z',
  },
  {
    id: 'log-002',
    usuarioId: 'usr-003',
    acao: 'pedido_status_alterado',
    entidade: 'pedido',
    entidadeId: 'ped-002',
    descricao: 'Pedido CPA-2026-0140: em separação → enviado',
    em: '2026-02-24T15:00:00Z',
  },
  {
    id: 'log-003',
    usuarioId: 'usr-001',
    acao: 'login',
    entidade: 'usuario',
    entidadeId: 'usr-001',
    descricao: 'Acessou o painel administrativo',
    em: '2026-02-25T13:42:00Z',
  },
];
