# COMPIA — Editora Tech & Ebooks

Aplicação web da COMPIA, migrada para uma arquitetura independente baseada em **React + TypeScript + Vite + React Router + Tailwind CSS**.

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm 10+

## Desenvolvimento

```bash
npm install
npm run dev
```

A aplicação estará disponível no endereço exibido pelo Vite, normalmente `http://localhost:5173`.

## Build de produção

```bash
npm run build
npm run preview
```

## Estrutura

- `src/main.tsx` — entrada do React
- `src/App.tsx` — providers e roteamento
- `src/pages/` — páginas da aplicação
- `src/components/` — componentes reutilizáveis
- `src/services/` — camada de dados/API
- `src/hooks/` — hooks de domínio
- `src/store/` — estado do carrinho
- `src/data/` — dados locais da demonstração
- `public/` — arquivos públicos

O projeto não depende do Lovable para desenvolvimento, build ou execução.
