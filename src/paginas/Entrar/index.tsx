import { useState } from 'react';
import { Link } from 'react-router-dom';

import { clientes } from '../../mocks';
import { cidadeDoCliente, DOMINIO_DA_EQUIPE } from '../../lib/sessao';
import { restaurarDemonstracao } from '../../lib/demonstracao';
import { useSessao } from '../../hooks/useSessao';

const CLASSE_TITULO_DE_SECAO =
  'font-display text-lg font-bold tracking-tight text-tinta';

function Entrar() {
  const { clienteCorrente, usuarioCorrente, entrarComoCliente, entrarComoUsuario, sairDaEquipe } =
    useSessao();

  /* Estado local do formulário: o e-mail digitado não é sessão, é rascunho. */
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [confirmandoReset, setConfirmandoReset] = useState(false);

  const restaurar = () => {
    restaurarDemonstracao();
    /* Recarregar é a saída honesta: os três providers ressemeiam a partir
       dos mocks na montagem. Reconstruí-los à mão convidaria inconsistência
       entre carrinho, sessão e pedidos. */
    location.reload();
  };

  const enviarAcessoDaEquipe = (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    const resultado = entrarComoUsuario(email);
    if (resultado.ok) {
      setEmail('');
      setErro('');
      return;
    }

    setErro(resultado.erro);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta md:text-4xl">
        Entrar
      </h1>

      {/* 1. Cliente corrente */}
      <section className="mt-10 border border-grafite/30 bg-white p-6">
        <h2 className={CLASSE_TITULO_DE_SECAO}>Entrar como cliente</h2>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-grafite">
          Seletor de demonstração: este projeto não tem autenticação, senha nem cadastro.
          Escolher um nome aqui só troca de quem é o carrinho, o endereço e os pedidos.
        </p>

        <fieldset className="mt-5">
          <legend className="sr-only">Cliente corrente</legend>

          <ul className="divide-y divide-grafite/20 border-y border-grafite/20">
            {clientes.map((cliente) => {
              const id = `cliente-${cliente.id}`;
              const ehCorrente = cliente.id === clienteCorrente.id;

              return (
                <li key={cliente.id}>
                  <label
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-3 py-3"
                  >
                    <input
                      type="radio"
                      id={id}
                      name="cliente"
                      value={cliente.id}
                      checked={ehCorrente}
                      onChange={() => entrarComoCliente(cliente.id)}
                      /* Círculo é inevitável num radio: o tema limita o raio a
                         4px, então aqui vale o valor arbitrário. */
                      className="h-4 w-4 shrink-0 rounded-[9999px] border border-grafite/50 accent-azul"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-tinta">
                        {cliente.nome}
                      </span>
                      <span className="block text-sm text-grafite">
                        {cidadeDoCliente(cliente)}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-grafite">{cliente.email}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <p className="mt-4 font-mono text-xs text-grafite">
          Agora comprando como {clienteCorrente.nome}.
        </p>
      </section>

      {/* 2. Equipe */}
      <section className="mt-8 border border-grafite/30 bg-white p-6">
        <h2 className={CLASSE_TITULO_DE_SECAO}>Acesso da equipe</h2>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-grafite">
          Painel administrativo. Basta o e-mail: não há senha, e o perfil vem do
          cadastro em {DOMINIO_DA_EQUIPE}.
        </p>

        {usuarioCorrente === null ? (
          <form onSubmit={enviarAcessoDaEquipe} className="mt-5 max-w-md">
            <label
              htmlFor="email-da-equipe"
              className="block font-display text-xs font-bold uppercase tracking-widest text-tinta"
            >
              E-mail
            </label>

            <div className="mt-2 flex">
              <input
                id="email-da-equipe"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(evento) => {
                  setEmail(evento.target.value);
                  if (erro !== '') setErro('');
                }}
                aria-invalid={erro !== ''}
                aria-describedby={erro !== '' ? 'erro-da-equipe' : undefined}
                placeholder={`nome${DOMINIO_DA_EQUIPE}`}
                className="w-full border border-grafite/40 bg-white px-3 py-2 text-sm text-tinta placeholder:text-grafite"
              />
              <button
                type="submit"
                className="shrink-0 border border-l-0 border-tinta bg-tinta px-4 py-2 font-display text-sm font-semibold text-papel transition-colors hover:bg-azul"
              >
                Entrar
              </button>
            </div>

            {/* Região sempre presente: leitor de tela só anuncia mudança
                dentro de um live region que já existe. */}
            <p
              id="erro-da-equipe"
              aria-live="polite"
              className="mt-2 min-h-[1.25rem] text-sm leading-relaxed text-ocre"
            >
              {erro}
            </p>
          </form>
        ) : (
          <div className="mt-5">
            <p className="text-sm text-tinta">
              <span className="font-semibold">{usuarioCorrente.nome}</span>
              <span className="text-grafite"> · perfil </span>
              <span className="font-mono text-xs uppercase tracking-wide">
                {usuarioCorrente.perfil}
              </span>
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/admin"
                className="bg-azul px-5 py-2 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
              >
                Ir para o painel
              </Link>
              <button
                type="button"
                onClick={sairDaEquipe}
                className="font-display text-sm text-azul hover:underline"
              >
                Sair do acesso da equipe
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. Reset da demonstração */}
      <section className="mt-8 border border-ocre/60 bg-white p-6">
        <h2 className={CLASSE_TITULO_DE_SECAO}>Restaurar dados de demonstração</h2>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-grafite">
          Apaga <strong className="font-semibold text-tinta">todos os carrinhos</strong>,
          a sessão salva e{' '}
          <strong className="font-semibold text-tinta">
            todos os pedidos criados nesta máquina
          </strong>
          . Os quatro pedidos, os dez produtos e os três clientes dos dados de exemplo
          voltam como estavam. A página recarrega em seguida.
        </p>

        {confirmandoReset ? (
          <div className="mt-5 border-l-2 border-ocre pl-4">
            <p className="text-sm font-semibold leading-relaxed text-tinta">
              Isto não tem desfazer. Apagar mesmo?
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={restaurar}
                className="bg-tinta px-5 py-2 font-display text-sm font-semibold text-papel transition-colors hover:bg-azul"
              >
                Apagar e restaurar
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoReset(false)}
                className="font-display text-sm text-azul hover:underline"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmandoReset(true)}
            className="mt-5 border border-tinta px-5 py-2 font-display text-sm font-semibold text-tinta transition-colors hover:bg-tinta hover:text-papel"
          >
            Restaurar demonstração
          </button>
        )}
      </section>
    </div>
  );
}

export default Entrar;
