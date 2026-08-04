import { useEffect, useRef, useState } from 'react';
import {
  criarControladorDeCampo,
  type ControladorDeCampo,
  type EscritaDeFiltro,
} from '../lib/campoDebounced';

interface Campo {
  /** O que o input mostra agora. */
  valor: string;
  /** onChange. */
  aoDigitar: (valor: string) => void;
  /** onBlur e onSubmit. */
  aoConfirmar: () => void;
}

/**
 * Casca React de `criarControladorDeCampo`.
 *
 * ATENÇÃO: `rascunho` é **buffer de digitação**, não fonte de verdade do
 * filtro. Ele guarda apenas o texto entre a tecla e o debounce. Quem manda
 * é a URL: sempre que `valorDaUrl` muda por fora — botão voltar, "Limpar
 * filtros", link com filtro pronto — o buffer é jogado fora e realinhado.
 */
export function useCampoDebounced(
  valorDaUrl: string,
  aplicar: (escrita: EscritaDeFiltro) => void,
  atrasoMs = 250,
): Campo {
  const [rascunho, setRascunho] = useState(valorDaUrl);

  /* `aplicar` costuma ser uma arrow recriada a cada render; guardar numa
     ref evita recriar o controlador (e perder o temporizador) por isso. */
  const aplicarRef = useRef(aplicar);
  useEffect(() => {
    aplicarRef.current = aplicar;
  });

  const controladorRef = useRef<ControladorDeCampo | undefined>(undefined);
  if (controladorRef.current === undefined) {
    controladorRef.current = criarControladorDeCampo(
      (escrita) => aplicarRef.current(escrita),
      valorDaUrl,
      atrasoMs,
    );
  }
  const controlador = controladorRef.current;

  /* Ressincronização com a URL, no corpo do render: é o padrão do React
     para ajustar estado quando a entrada muda, e só dispara quando muda
     mesmo. Uma escrita nossa deixa `valorDaUrl` igual ao rascunho, então
     digitar não cai aqui. */
  const ultimoValorDaUrl = useRef(valorDaUrl);
  if (valorDaUrl !== ultimoValorDaUrl.current) {
    ultimoValorDaUrl.current = valorDaUrl;
    controlador.sincronizar(valorDaUrl);
    setRascunho(valorDaUrl);
  }

  useEffect(() => () => controlador.descartar(), [controlador]);

  return {
    valor: rascunho,
    aoDigitar(valor) {
      setRascunho(valor);
      controlador.digitar(valor);
    },
    aoConfirmar() {
      controlador.confirmar(rascunho);
    },
  };
}
