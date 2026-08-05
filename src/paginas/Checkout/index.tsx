import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import type { Endereco, Entrega, MetodoPagamento, ModalidadeEntrega } from '../../types';
import { localDeRetirada } from '../../mocks';
import { linhasDoCarrinho, pesoTotal } from '../../lib/carrinho';
import { calcularFrete } from '../../lib/frete';
import {
  detectarBandeira,
  gerarCobrancaPix,
  parcelasDisponiveis,
  processarCartao,
  type DadosDoCartao,
} from '../../lib/pagamento';
import {
  ERRO_DE_CARTAO_RECUSADO,
  TITULO_DO_PASSO,
  errosDoCartao,
  errosDoEndereco,
  formatarCvv,
  formatarNumeroDeCartao,
  formatarValidade,
  mensagemDeCheckoutAbortado,
  mensagemDePassoBloqueado,
  passoPermitido,
  passosVisiveis,
  primeiroPassoPendente,
  type CampoDoCartao,
  type EstadoDoCheckout,
  type Passo,
} from '../../lib/checkout';
import { aplicarPagamento, criarPedido, gerarNumeroPedido } from '../../lib/pedido';
import { enderecoPrincipal } from '../../lib/sessao';
import { useCarrinho } from '../../hooks/useCarrinho';
import { usePedidos } from '../../hooks/usePedidos';
import { useProdutos } from '../../hooks/useProdutos';
import { useSessao } from '../../hooks/useSessao';
import PassoConfirmacao from '../../components/PassoConfirmacao';
import PassoEndereco from '../../components/PassoEndereco';
import PassoFrete from '../../components/PassoFrete';
import PassoPagamento from '../../components/PassoPagamento';
import TrilhaDoCheckout from '../../components/TrilhaDoCheckout';

const ENDERECO_EM_BRANCO: Endereco = {
  id: 'endereco-do-checkout',
  apelido: 'Entrega',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
  principal: false,
};

const CARTAO_EM_BRANCO: DadosDoCartao = {
  numero: '',
  nome: '',
  validade: '',
  cvv: '',
  parcelas: 1,
};

function Checkout() {
  const navegar = useNavigate();
  const [parametros, setParametros] = useSearchParams();

  const { clienteCorrente } = useSessao();
  const { itens, subtotal, limpar, avisar } = useCarrinho();
  const { pedidos, adicionarPedido } = usePedidos();
  const { produtos, baixarEstoque } = useProdutos();

  /* Fronteira do relógio. Congelado na montagem: a validação de validade de
     cartão compara mês, e um valor que muda a cada render só criaria ruído.
     A criação do pedido usa a hora do clique, mais adiante. */
  const [agora] = useState(() => new Date().toISOString());

  /* Formulário em estado local. Não vai para contexto nem para
     localStorage: dado de cartão morre nesta tela. */
  const [dados, setDados] = useState<EstadoDoCheckout>(() => ({
    endereco: enderecoPrincipal(clienteCorrente) ?? ENDERECO_EM_BRANCO,
    modalidade: 'envio',
    opcaoFreteId: null,
    metodo: null,
    cartao: CARTAO_EM_BRANCO,
  }));

  const [tocados, setTocados] = useState<Set<string>>(new Set());
  const [erroDaCobranca, setErroDaCobranca] = useState('');
  /* Região viva única da tela: resumo de campos pendentes ou recusa de
     pagamento — nunca as duas juntas, uma substitui a outra. */
  const [mensagemDeStatus, setMensagemDeStatus] = useState('');

  const linhas = linhasDoCarrinho(itens, produtos);
  const precisaDeEntrega = pesoTotal(itens, produtos) > 0;
  const modalidadeEfetiva: ModalidadeEntrega = precisaDeEntrega
    ? dados.modalidade
    : 'download';

  const opcoesDeFrete = precisaDeEntrega
    ? calcularFrete(dados.endereco.cep, itens, produtos)
    : [];
  const opcaoEscolhida =
    opcoesDeFrete.find((opcao) => opcao.id === dados.opcaoFreteId) ?? null;

  const frete =
    modalidadeEfetiva === 'envio' && opcaoEscolhida !== null ? opcaoEscolhida.valor : 0;
  const total = subtotal + frete;

  const passos = passosVisiveis(precisaDeEntrega, modalidadeEfetiva);
  const passoAtual: Passo = passoPermitido(
    Number(parametros.get('passo')),
    { ...dados, modalidade: modalidadeEfetiva },
    precisaDeEntrega,
    agora,
  );

  const errosDeEndereco = errosDoEndereco(dados.endereco);
  const errosDeCartao = errosDoCartao(dados.cartao, agora);
  const bandeira = detectarBandeira(dados.cartao.numero);

  /* Abortar quando o cliente da sessão muda no meio do fluxo. O carrinho que
     originou este checkout nem está mais carregado, e o endereço é do
     anterior: seguir produziria um pedido incoerente. */
  const clienteDeOrigem = useRef(clienteCorrente.id);
  useEffect(() => {
    if (clienteCorrente.id === clienteDeOrigem.current) return;

    avisar(mensagemDeCheckoutAbortado(clienteCorrente.nome));
    navegar('/carrinho', { replace: true });
  }, [avisar, clienteCorrente.id, clienteCorrente.nome, navegar]);

  /* A URL sempre reflete o passo real. Se alguém pedir ?passo=4 sem endereço,
     `passoPermitido` já devolveu o pendente e aqui a URL é corrigida. */
  useEffect(() => {
    if (parametros.get('passo') !== String(passoAtual)) {
      const proximos = new URLSearchParams(parametros);
      proximos.set('passo', String(passoAtual));
      setParametros(proximos, { replace: true });
    }
  }, [parametros, passoAtual, setParametros]);

  /* Foco vai para o título do passo a cada transição. */
  const tituloRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    tituloRef.current?.focus();
  }, [passoAtual]);

  const irPara = (passo: Passo) => {
    const proximos = new URLSearchParams(parametros);
    proximos.set('passo', String(passo));
    setParametros(proximos);
  };

  const tocar = (campo: string) =>
    setTocados((anteriores) => new Set(anteriores).add(campo));

  /* Ao avançar, marca tudo do passo como tocado: erro só aparece depois de
     interagir, mas tentar seguir conta como interação com o passo inteiro. */
  const avancar = () => {
    if (passoAtual === 1) {
      setTocados(
        (anteriores) =>
          new Set([...anteriores, 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf']),
      );
    }
    if (passoAtual === 3 && dados.metodo === 'cartao') {
      setTocados(
        (anteriores) => new Set([...anteriores, 'numero', 'nome', 'validade', 'cvv']),
      );
    }

    const pendente = primeiroPassoPendente(
      { ...dados, modalidade: modalidadeEfetiva },
      precisaDeEntrega,
      agora,
    );
    const proximo = passos[passos.indexOf(passoAtual) + 1];
    if (proximo === undefined) return;

    if (proximo <= pendente) {
      setMensagemDeStatus('');
      irPara(proximo);
      return;
    }

    setMensagemDeStatus(
      mensagemDePassoBloqueado(
        pendente,
        dados.metodo,
        Object.keys(errosDeEndereco).length,
        Object.keys(errosDeCartao).length,
      ),
    );
    irPara(pendente);
  };

  const voltar = () => {
    const anterior = passos[passos.indexOf(passoAtual) - 1];
    if (anterior !== undefined) irPara(anterior);
  };

  const montarEntrega = (): Entrega => {
    if (modalidadeEfetiva === 'download') return { modalidade: 'download', valor: 0 };
    if (modalidadeEfetiva === 'retirada') return { modalidade: 'retirada', valor: 0 };

    return {
      modalidade: 'envio',
      endereco: dados.endereco,
      ...(opcaoEscolhida === null ? {} : { opcaoFrete: opcaoEscolhida }),
      valor: frete,
    };
  };

  /* Marca que o pedido saiu, para não piscar o estado vazio enquanto a
     navegação acontece: `limpar()` esvazia o carrinho antes da troca de rota. */
  const finalizando = useRef(false);

  const confirmar = () => {
    const agoraDoClique = new Date().toISOString();

    const pagamento =
      dados.metodo === 'cartao'
        ? processarCartao(dados.cartao, total)
        : gerarCobrancaPix(total, agoraDoClique);

    // Recusa não cria pedido: o carrinho fica intacto e o erro aparece no passo 3.
    if (pagamento.status === 'recusado') {
      setErroDaCobranca(ERRO_DE_CARTAO_RECUSADO);
      setMensagemDeStatus(ERRO_DE_CARTAO_RECUSADO);
      irPara(3);
      return;
    }

    const numero = gerarNumeroPedido(pedidos, new Date(agoraDoClique).getUTCFullYear());

    const pedido = aplicarPagamento(
      criarPedido({
        cliente: clienteCorrente,
        itens,
        produtos,
        entrega: montarEntrega(),
        pagamento,
        numero,
        agora: agoraDoClique,
      }),
      pagamento,
      agoraDoClique,
      produtos,
    );

    finalizando.current = true;
    adicionarPedido(pedido);
    baixarEstoque(itens);
    limpar();
    // `replace` para o voltar não cair de novo na confirmação.
    navegar(`/pedido/${numero}`, { replace: true });
  };

  if (finalizando.current) return null;

  if (linhas.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta">
          Não há o que finalizar.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-grafite">
          Seu carrinho está vazio.
        </p>
        <Link
          to="/catalogo"
          className="mt-8 inline-block bg-azul px-5 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  const ehUltimo = passoAtual === 4;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta md:text-4xl">
        Finalizar compra
      </h1>

      {/* Região viva única da tela: resumo de campos pendentes ou recusa de
          pagamento. Erro de campo mesmo é anunciado por aria-describedby. */}
      <p aria-live="polite" className="sr-only">
        {mensagemDeStatus}
      </p>

      <div className="mt-8">
        <TrilhaDoCheckout passos={passos} atual={passoAtual} />
      </div>

      {!precisaDeEntrega && (
        <p className="mb-8 border-l-2 border-grafite/40 bg-white px-4 py-3 text-sm leading-relaxed text-grafite">
          Pedido só com e-book: não há endereço nem frete. A entrega é por download,
          liberada assim que o pagamento for confirmado.
        </p>
      )}

      <section aria-labelledby="titulo-do-passo">
        <h2
          id="titulo-do-passo"
          ref={tituloRef}
          tabIndex={-1}
          className="font-display text-xl font-bold tracking-tight text-tinta"
        >
          {TITULO_DO_PASSO[passoAtual]}
        </h2>

        <div className="mt-6">
          {passoAtual === 1 && (
            <PassoEndereco
              endereco={dados.endereco}
              modalidade={dados.modalidade}
              erros={errosDeEndereco}
              tocados={tocados}
              localDeRetirada={localDeRetirada}
              aoMudarCampo={(campo, valor) =>
                setDados((anterior) => ({
                  ...anterior,
                  endereco: { ...anterior.endereco, [campo]: valor },
                  /* Mudar o CEP invalida o frete já escolhido: as opções são
                     calculadas a partir dele. */
                  opcaoFreteId: campo === 'cep' ? null : anterior.opcaoFreteId,
                }))
              }
              aoTocarCampo={(campo) => tocar(campo)}
              aoMudarModalidade={(modalidade) =>
                setDados((anterior) => ({ ...anterior, modalidade, opcaoFreteId: null }))
              }
            />
          )}

          {passoAtual === 2 && (
            <PassoFrete
              opcoes={opcoesDeFrete}
              escolhida={dados.opcaoFreteId}
              cep={dados.endereco.cep}
              aoEscolher={(id) =>
                setDados((anterior) => ({ ...anterior, opcaoFreteId: id }))
              }
            />
          )}

          {passoAtual === 3 && (
            <PassoPagamento
              metodo={dados.metodo}
              cartao={dados.cartao}
              bandeira={bandeira}
              erros={errosDeCartao}
              tocados={tocados}
              parcelas={parcelasDisponiveis(total)}
              total={total}
              erroDaCobranca={erroDaCobranca}
              aoMudarMetodo={(metodo: MetodoPagamento) => {
                setErroDaCobranca('');
                setMensagemDeStatus('');
                setDados((anterior) => ({ ...anterior, metodo }));
              }}
              aoMudarCartao={(campo, valor) => {
                setErroDaCobranca('');
                setMensagemDeStatus('');
                setDados((anterior) => ({
                  ...anterior,
                  cartao: {
                    ...anterior.cartao,
                    [campo]:
                      campo === 'numero'
                        ? formatarNumeroDeCartao(valor)
                        : campo === 'validade'
                          ? formatarValidade(valor)
                          : campo === 'cvv'
                            ? formatarCvv(valor)
                            : campo === 'parcelas'
                              ? Number(valor)
                              : valor,
                  },
                }));
              }}
              aoTocarCartao={(campo: CampoDoCartao) => tocar(campo)}
            />
          )}

          {passoAtual === 4 && (
            <PassoConfirmacao
              linhas={linhas}
              subtotal={subtotal}
              frete={frete}
              total={total}
              modalidade={modalidadeEfetiva === 'download' ? 'download' : dados.modalidade}
              endereco={modalidadeEfetiva === 'envio' ? dados.endereco : null}
              localDeRetirada={localDeRetirada}
              opcaoFrete={opcaoEscolhida}
              metodo={dados.metodo}
              ultimosDigitos={dados.cartao.numero.replace(/\D/g, '').slice(-4)}
              parcelas={dados.cartao.parcelas}
            />
          )}
        </div>
      </section>

      {/* Navegação */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-grafite/20 pt-6">
        {passos.indexOf(passoAtual) > 0 ? (
          <button
            type="button"
            onClick={voltar}
            className="font-display text-sm text-azul hover:underline"
          >
            Voltar ao passo anterior
          </button>
        ) : (
          <Link to="/carrinho" className="font-display text-sm text-azul hover:underline">
            Voltar ao carrinho
          </Link>
        )}

        {ehUltimo ? (
          <button
            type="button"
            onClick={confirmar}
            className="bg-azul px-6 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
          >
            {dados.metodo === 'pix' ? 'Confirmar e gerar PIX' : 'Confirmar e pagar'}
          </button>
        ) : (
          <button
            type="button"
            onClick={avancar}
            className="bg-azul px-6 py-3 font-display text-sm font-semibold text-papel transition-colors hover:bg-tinta"
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}

export default Checkout;
