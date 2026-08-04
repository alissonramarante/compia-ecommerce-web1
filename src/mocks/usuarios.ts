import type { Usuario } from '../types';

/** Login sem senha: basta o e-mail existir aqui. */
export const usuarios: Usuario[] = [
  {
    id: 'usr-001',
    nome: 'Renata Coutinho',
    email: 'renata@compia.com.br',
    perfil: 'admin',
    ativo: true,
    ultimoAcesso: '2026-02-25T13:42:00Z',
  },
  {
    id: 'usr-002',
    nome: 'Gustavo Peixoto',
    email: 'gustavo@compia.com.br',
    perfil: 'editor',
    ativo: true,
    ultimoAcesso: '2026-02-24T09:10:00Z',
  },
  {
    id: 'usr-003',
    nome: 'Cláudia Menezes',
    email: 'claudia@compia.com.br',
    perfil: 'vendedor',
    ativo: true,
    ultimoAcesso: '2026-02-25T08:05:00Z',
  },
  {
    id: 'usr-004',
    nome: 'Otávio Lemos',
    email: 'otavio@compia.com.br',
    perfil: 'vendedor',
    ativo: false,
  },
];
