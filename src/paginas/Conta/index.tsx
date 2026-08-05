import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import type { FormatoEbook } from '../../types';
import {
  ABAS,
  AVISO_DE_RECOMPRA_IMPOSSIVEL,
  descontarDownload,
  downloadsDoCliente,
  lerAba,
  planejarRecompra,
  tempoRestante,
} from '../../lib/conta';
import { cobrancaExpirada } from '../../lib/pagamento';
import { formatarCep, formatarCpf, mascararCpf } from '../../lib/formatadores';
import { useCarrinho } from '../../hooks/useCarrinho';
import { usePedidos } from '../../hooks/usePedidos';
import { useProdutos } from '../../hooks/useProdutos';
import { useSessao } from '../../hooks/useSessao';
import LinhaDePedido from '../../components/LinhaDePedido';
import ListaDeDownloads from '../../components/ListaDeDownloads';

const CLASSE_ROTULO =
  'font-display text-xs font-bold uppercase tracking-widest text-grafite';

function Conta() {
  /* Só leitura: as abas são links, e quem escreve na URL é o roteador. */
  const [parametros] = useSearchParams();
  const { clienteCorrente, usuarioCorrente } = useSessao();
  const { pedidosDoCliente, atualizarPedido, pedidos } = usePedidos();
  const { adicionar, avisar } = useCarrinho();
  const { produtos } = useProdutos();

  /* Fronteira do relógio, congelada na montagem: decide o que é cobrança em
     aberto e o que já venceu. */
  const [agora] = useState(() => new Date().toISOString());

  /* Revelar o CPF é decisão da sessão, não preferência: nada é persistido. */
  const [cpfRevelado, setCpfRevelado] = useState(false);
  const [avisoDaRecompra, setAvisoDaRecompra] = useState('');

  const aba = lerAba(parametros.get('aba'));
  const meusPedidos = pedidosDoCliente(clienteCorrente.id);
  const grupos = downloadsDoCliente(pedidos, clienteCorrente.id);

  const comprarDeNovo = (numero: string) => {
    const pedido = meusPedidos.find((candidato) => candidato.numero === numero);
    if (pedido === undefined) return;

    const plano = planejarRecompra(pedido, produtos);

    if (plano.vazio) {
      setAvisoDaRecompra(AVISO_DE_RECOMPRA_IMPOSSIVEL);
      return;
    }

    for (const { produto, quantidade } of plano.adicionaveis) {
      adicionar(produto, quantidade);
    }

    /* O aviso de omissão vai para o carrinho, que é para onde a pessoa está
       indo. Ficar nesta tela esconderia a informação do destino. */
    if (plano.aviso !== '') avisar(plano.aviso);

    setAvisoDaRecompra('');
  };

  const baixar = (pedidoId: string, produtoId: string, formato: FormatoEbook) => {
    const pedido = pedidos.find((candidato) => candidato.id === pedidoId);
    if (pedido === undefined) return;

    atualizarPedido(descontarDownload(pedido, produtoId, formato));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-grafite">
        Minha conta
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-tinta md:text-4xl">
        {clienteCorrente.nome}
      </h1>

      {/* Abas como links: o estado vive na URL e cada aba é endereçável.
          `role="tablist"` exigiria navegação por setas e painéis ligados por
          aria-controls — ARIA decorativo sobre links seria pior que links. */}
      <nav aria-label="Seções da conta" className="mt-8 border-b border-grafite/30">
        <ul className="flex flex-wrap gap-x-8">
          {ABAS.map((item) => {
            const ativa = item.valor === aba;

            return (
              <li key={item.valor}>
                <Link
                  to={`/conta?aba=${item.valor}`}
                  aria-current={ativa ? 'page' : undefined}
                  className={`-mb-px inline-block border-b-2 pb-3 font-display text-sm tracking-tight transition-colors ${
                    ativa
                      ? 'border-azul font-semibold text-tinta'
                      : 'border-transparent text-grafite hover:text-tinta'
                  }`}
                >
                  {item.rotulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-8">
        {/* ---------------- Pedidos ---------------- */}
        {aba === 'pedidos' && (
          <section aria-labelledby="titulo-pedidos">
            <h2 id="titulo-pedidos" className={CLASSE_ROTULO}>
              Pedidos
            </h2>

            <p aria-live="polite" className="mt-2 text-sm leading-relaxed text-ocre">
              {avisoDaRecompra}
            </p>

            {meusPedidos.length === 0 ? (
              <div className="mt-4 border border-grafite/25 bg-white px-6 py-16 text-center">
                <p className="font-display text-lg font-bold tracking-tight text-tinta">
                  Você ainda não fez pedidos.
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-grafite">
                  Quando comprar, o acompanhamento de cada pedido aparece aqui.
                </p>
                <Link
                  to="/catalogo"
                  className="mt-6 inline-block bg-azul px-5 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
                >
                  Ver catálogo
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-4">
                {meusPedidos.map((pedido) => {
                  const pixEmAberto =
                    pedido.pagamento.metodo === 'pix' &&
                    pedido.pagamento.status === 'pendente';
                  const expirada = cobrancaExpirada(pedido.pagamento, agora);

                  return (
                    <li key={pedido.id}>
                      <LinhaDePedido
                        pedido={pedido}
                        tempoRestanteDoPix={
                          pixEmAberto && !expirada
                            ? tempoRestante(pedido.pagamento.expiraEm ?? '', agora)
                            : ''
                        }
                        cobrancaExpirada={expirada}
                        aoComprarDeNovo={() => comprarDeNovo(pedido.numero)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* ---------------- Downloads ---------------- */}
        {aba === 'downloads' && (
          <section aria-labelledby="titulo-downloads">
            <h2 id="titulo-downloads" className={CLASSE_ROTULO}>
              Downloads
            </h2>

            {grupos.length === 0 ? (
              <div className="mt-4 border border-grafite/25 bg-white px-6 py-16 text-center">
                <p className="font-display text-lg font-bold tracking-tight text-tinta">
                  {meusPedidos.length === 0
                    ? 'Você ainda não comprou e-books.'
                    : 'Nenhum e-book nos seus pedidos.'}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-grafite">
                  {meusPedidos.length === 0
                    ? 'E-books comprados aqui ficam disponíveis nesta aba, com um link por formato.'
                    : 'Seus pedidos até agora são de livros físicos ou kits. E-books aparecem aqui assim que o pagamento é confirmado.'}
                </p>
                <Link
                  to="/catalogo?tipo=ebook"
                  className="mt-6 inline-block bg-azul px-5 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
                >
                  Ver e-books
                </Link>
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-grafite">
                  Os links são fictícios: este projeto não hospeda arquivo nenhum. Clicar
                  desconta um download da cota, para o comportamento ficar visível.
                </p>
                <div className="mt-4">
                  <ListaDeDownloads grupos={grupos} aoBaixar={baixar} />
                </div>
              </>
            )}
          </section>
        )}

        {/* ---------------- Dados ---------------- */}
        {aba === 'dados' && (
          <section aria-labelledby="titulo-dados" className="space-y-8">
            <h2 id="titulo-dados" className={CLASSE_ROTULO}>
              Meus dados
            </h2>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className={CLASSE_ROTULO}>Nome</dt>
                <dd className="mt-1 text-sm text-tinta">{clienteCorrente.nome}</dd>
              </div>
              <div>
                <dt className={CLASSE_ROTULO}>E-mail</dt>
                <dd className="mt-1 text-sm text-tinta">{clienteCorrente.email}</dd>
              </div>
              <div>
                <dt className={CLASSE_ROTULO}>Telefone</dt>
                <dd className="mt-1 font-mono text-sm text-tinta">
                  {clienteCorrente.telefone}
                </dd>
              </div>
              <div>
                <dt className={CLASSE_ROTULO}>CPF</dt>
                <dd className="mt-1 flex items-baseline gap-3">
                  <span className="font-mono text-sm text-tinta">
                    {cpfRevelado
                      ? formatarCpf(clienteCorrente.cpf)
                      : mascararCpf(clienteCorrente.cpf)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCpfRevelado((anterior) => !anterior)}
                    aria-pressed={cpfRevelado}
                    className="font-display text-xs text-azul hover:underline"
                  >
                    {cpfRevelado ? 'ocultar' : 'mostrar'}
                  </button>
                </dd>
              </div>
            </dl>

            <div>
              <h3 className={CLASSE_ROTULO}>Endereços</h3>
              <p className="mt-1 text-xs leading-relaxed text-grafite">
                Somente leitura. O endereço de cada entrega é escolhido no checkout.
              </p>

              <ul className="mt-3 grid gap-4 sm:grid-cols-2">
                {clienteCorrente.enderecos.map((endereco) => (
                  <li
                    key={endereco.id}
                    className="border border-grafite/25 bg-white p-4"
                  >
                    <p className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-sm font-semibold text-tinta">
                        {endereco.apelido}
                      </span>
                      {endereco.principal && (
                        <span className="border border-grafite/40 px-2 font-mono text-[11px] uppercase tracking-wide text-grafite">
                          principal
                        </span>
                      )}
                    </p>
                    <address className="mt-2 space-y-1 text-sm not-italic leading-relaxed text-grafite">
                      <p>
                        {endereco.logradouro}, {endereco.numero}
                        {endereco.complemento === undefined
                          ? ''
                          : ` — ${endereco.complemento}`}
                      </p>
                      <p>
                        {endereco.bairro} — {endereco.cidade}/{endereco.uf}
                      </p>
                      <p className="font-mono text-xs">CEP {formatarCep(endereco.cep)}</p>
                    </address>
                  </li>
                ))}
              </ul>
            </div>

            {/* Só aparece com alguém da equipe logado. */}
            {usuarioCorrente !== null && (
              <div className="border border-grafite/30 bg-white p-5">
                <h3 className={CLASSE_ROTULO}>Acesso da equipe</h3>
                <p className="mt-2 text-sm text-tinta">
                  {usuarioCorrente.nome}
                  <span className="text-grafite"> · perfil </span>
                  <span className="font-mono text-xs uppercase tracking-wide">
                    {usuarioCorrente.perfil}
                  </span>
                </p>
                <Link
                  to="/admin"
                  className="mt-4 inline-block bg-azul px-5 py-2 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
                >
                  Ir para o painel
                </Link>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default Conta;
