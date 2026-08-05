import { useContext } from 'react';
import { LogsContext, type ValorDosLogs } from '../contexts/LogsContext';

/** Acesso aos logs. Só páginas chamam; componentes recebem props. */
export function useLogs(): ValorDosLogs {
  const valor = useContext(LogsContext);

  if (valor === null) {
    throw new Error(
      'useLogs foi chamado fora do <LogsProvider>. Envolva as rotas com ele em App.tsx.',
    );
  }

  return valor;
}
