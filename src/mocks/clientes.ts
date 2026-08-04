import type { Cliente } from '../types';

export const clientes: Cliente[] = [
  {
    id: 'cli-001',
    nome: 'Yasmim Oliveira',
    email: 'yasmim@exemplo.com',
    telefone: '(83) 99812-3344',
    cpf: '123.456.789-00',
    criadoEm: '2025-11-03T14:20:00Z',
    enderecos: [
      {
        id: 'end-001',
        apelido: 'Casa',
        cep: '58429-140',
        logradouro: 'Rua Aprígio Veloso',
        numero: '882',
        complemento: 'Bloco CN',
        bairro: 'Universitário',
        cidade: 'Campina Grande',
        uf: 'PB',
        principal: true,
      },
    ],
  },
  {
    id: 'cli-002',
    nome: 'Eduardo Sampaio',
    email: 'eduardo.sampaio@exemplo.com',
    telefone: '(11) 98877-1200',
    cpf: '987.654.321-00',
    criadoEm: '2026-01-17T10:05:00Z',
    enderecos: [
      {
        id: 'end-002',
        apelido: 'Escritório',
        cep: '01310-200',
        logradouro: 'Avenida Paulista',
        numero: '1578',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
        principal: true,
      },
    ],
  },
  {
    id: 'cli-003',
    nome: 'Larissa Fontes',
    email: 'larissa.fontes@exemplo.com',
    telefone: '(71) 99143-7788',
    cpf: '456.123.789-11',
    criadoEm: '2026-02-06T18:45:00Z',
    enderecos: [
      {
        id: 'end-003',
        apelido: 'Casa',
        cep: '40140-130',
        logradouro: 'Rua da Paciência',
        numero: '210',
        bairro: 'Rio Vermelho',
        cidade: 'Salvador',
        uf: 'BA',
        principal: true,
      },
    ],
  },
];
