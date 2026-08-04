/**
 * Mecânica de um campo de texto que filtra ao vivo sem poluir o histórico.
 *
 * Fica aqui, fora do React, por dois motivos: é lógica de verdade (quando
 * escrever, e se a escrita empilha uma entrada de histórico) e é testável
 * sem DOM. O hook `useCampoDebounced` é só a casca React em volta disto.
 */

export interface EscritaDeFiltro {
  valor: string;
  /**
   * `true` empilha uma entrada de histórico (`setSearchParams` normal),
   * `false` substitui a atual (`{ replace: true }`).
   */
  empilhar: boolean;
}

export interface ControladorDeCampo {
  /** Uma tecla. Reagenda o debounce; não empilha histórico. */
  digitar: (valor: string) => void;
  /** Enter ou blur. Aplica na hora e empilha uma entrada. */
  confirmar: (valor: string) => void;
  /** A URL mudou por fora (voltar, limpar filtros): realinha a referência. */
  sincronizar: (valor: string) => void;
  /** Desmonte: cancela o que estiver pendente. */
  descartar: () => void;
}

/**
 * Estágios:
 *   1. `digitar` reagenda o temporizador. Dez teclas em sequência deixam
 *      um único agendamento vivo, então o resultado é **uma** escrita com
 *      `empilhar: false` — dez teclas, zero entradas de histórico.
 *   2. `confirmar` cancela o pendente e escreve na hora, empilhando.
 *   3. Escrita que não muda nada é descartada. Sem isso, clicar em "Buscar"
 *      dispararia blur e submit com o mesmo texto e empilharia duas vezes.
 *
 * Testes de mesa (atraso 20ms, `aplicar` registrando as chamadas):
 *   digitar m,a,t + espera            → 1 escrita  { 'mat', empilhar false }
 *   digitar m,a,t + confirmar('mat')  → 1 escrita  { 'mat', empilhar true  }
 *   confirmar(valor inicial)          → 0 escritas
 *   digitar 'x' e voltar ao inicial   → 0 escritas
 *   digitar + descartar               → 0 escritas
 *   sincronizar('ia') + confirmar('ia') → 0 escritas
 */
export function criarControladorDeCampo(
  aplicar: (escrita: EscritaDeFiltro) => void,
  valorInicial: string,
  atrasoMs = 250,
): ControladorDeCampo {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  let ultimoAplicado = valorInicial;

  const cancelar = () => {
    if (temporizador !== undefined) {
      clearTimeout(temporizador);
      temporizador = undefined;
    }
  };

  const escrever = (valor: string, empilhar: boolean) => {
    // 3. Nada mudou, nada a escrever.
    if (valor === ultimoAplicado) return;

    ultimoAplicado = valor;
    aplicar({ valor, empilhar });
  };

  return {
    // 1. Ao vivo, substituindo a entrada atual.
    digitar(valor) {
      cancelar();
      temporizador = setTimeout(() => {
        temporizador = undefined;
        escrever(valor, false);
      }, atrasoMs);
    },

    // 2. Confirmação explícita, empilhando.
    confirmar(valor) {
      cancelar();
      escrever(valor, true);
    },

    sincronizar(valor) {
      cancelar();
      ultimoAplicado = valor;
    },

    descartar: cancelar,
  };
}
