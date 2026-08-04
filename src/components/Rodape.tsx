import { Link } from 'react-router-dom';
import { localDeRetirada } from '../mocks';
import { formatarCep } from '../lib/formatadores';

const atalhos = [
  { rotulo: 'Catálogo', destino: '/catalogo' },
  { rotulo: 'Carrinho', destino: '/carrinho' },
  { rotulo: 'Minha conta', destino: '/conta' },
  { rotulo: 'Entrar', destino: '/entrar' },
];

function Rodape() {
  return (
    <footer className="mt-24 border-t border-grafite/30 bg-papel">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3 md:px-6">
        {/* Identificação */}
        <div>
          <p className="font-display text-lg font-bold uppercase tracking-tight text-tinta">
            COMPIA Editora
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-grafite">
            Materiais técnicos de inteligência artificial: livros, e-books, revistas e kits.
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-wide text-grafite">
            CNPJ 00.000.000/0001-00
          </p>
        </div>

        {/* Endereço */}
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-tinta">
            Sede
          </h2>
          <address className="mt-3 space-y-1 text-sm not-italic leading-relaxed text-grafite">
            <p>{localDeRetirada.logradouro}</p>
            <p>
              {localDeRetirada.bairro} — {localDeRetirada.cidade}/{localDeRetirada.uf}
            </p>
            <p className="font-mono text-xs">CEP {formatarCep(localDeRetirada.cep)}</p>
            <p>{localDeRetirada.horario}</p>
            <p className="pt-2">
              <a href="mailto:contato@compia.com.br" className="text-azul hover:underline">
                contato@compia.com.br
              </a>
            </p>
          </address>
        </div>

        {/* Atalhos */}
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-tinta">
            Navegar
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {atalhos.map((atalho) => (
              <li key={atalho.destino}>
                <Link to={atalho.destino} className="text-grafite hover:text-azul">
                  {atalho.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-grafite/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-grafite md:flex-row md:items-center md:justify-between md:px-6">
          <p className="font-mono">
            © 2026 COMPIA Editora · Projeto acadêmico UFCG
          </p>
          <Link to="/admin" className="font-mono text-azul hover:underline">
            Painel administrativo
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Rodape;
