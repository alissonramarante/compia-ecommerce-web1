import { useCallback, useEffect, useRef, useState } from 'react';

interface Sinal {
  ativo: boolean;
  disparar: () => void;
}

/**
 * Liga uma flag por alguns segundos e desliga sozinha. Usado na confirmação
 * de "Adicionado" — é troca de texto, não animação, então não há nada a
 * suprimir sob `prefers-reduced-motion`.
 *
 * Disparar de novo antes de expirar reinicia a contagem em vez de somar
 * temporizadores.
 */
export function useSinalTemporario(duracaoMs = 2000): Sinal {
  const [ativo, setAtivo] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cancelar = useCallback(() => {
    if (temporizador.current !== undefined) {
      clearTimeout(temporizador.current);
      temporizador.current = undefined;
    }
  }, []);

  useEffect(() => cancelar, [cancelar]);

  const disparar = useCallback(() => {
    cancelar();
    setAtivo(true);

    temporizador.current = setTimeout(() => {
      temporizador.current = undefined;
      setAtivo(false);
    }, duracaoMs);
  }, [cancelar, duracaoMs]);

  return { ativo, disparar };
}
