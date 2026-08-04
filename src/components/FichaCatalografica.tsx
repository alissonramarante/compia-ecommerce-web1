import type { FichaCatalografica as Ficha } from '../types';

interface Props {
  ficha: Ficha;
  titulo: string;
  autores: string[];
}

/**
 * Reprodução da ficha CIP que vai no verso da folha de rosto de um livro
 * brasileiro. É o elemento assinatura da loja: bloco em monoespaçada,
 * moldura fina, rótulos alinhados em coluna.
 *
 * Não é uma tabela de especificações de e-commerce — a ordem dos campos e o
 * vocabulário seguem a ficha real. Quem não tem ficha (kit) simplesmente não
 * renderiza este componente: moldura vazia seria pior que ausência.
 */
function FichaCatalografica({ ficha, titulo, autores }: Props) {
  const linhas: { rotulo: string; valor: string }[] = [
    { rotulo: 'Autor', valor: autores.join('; ') },
    { rotulo: 'Título', valor: titulo },
    { rotulo: 'Edição', valor: ficha.edicao },
    { rotulo: 'Ano', valor: String(ficha.ano) },
    { rotulo: 'Páginas', valor: `${ficha.paginas} p.` },
    { rotulo: 'Idioma', valor: ficha.idioma },
    { rotulo: 'ISBN', valor: ficha.isbn },
    { rotulo: 'CDU', valor: ficha.cdu },
    { rotulo: 'Editora', valor: ficha.editora },
  ];

  return (
    <section aria-labelledby="ficha-titulo" className="border border-grafite/60 bg-white">
      <h2
        id="ficha-titulo"
        className="border-b border-grafite/60 px-4 py-2 text-center font-mono text-[11px] uppercase leading-relaxed tracking-widest text-grafite"
      >
        Dados internacionais de catalogação na publicação (CIP)
      </h2>

      <dl className="px-4 py-4 font-mono text-xs leading-relaxed text-tinta">
        {linhas.map((linha) => (
          <div key={linha.rotulo} className="flex gap-3 py-[3px]">
            <dt className="w-20 shrink-0 uppercase tracking-wide text-grafite">
              {linha.rotulo}
            </dt>
            <dd className="flex-1">{linha.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default FichaCatalografica;
