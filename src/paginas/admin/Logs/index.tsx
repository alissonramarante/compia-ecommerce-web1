import { useSearchParams } from 'react-router-dom';

import type { AcaoLog } from '../../../types';
import { usuarios } from '../../../mocks';
import { ROTULO_DE_ACAO, filtrarLogs } from '../../../lib/log';
import { formatarData } from '../../../lib/formatadores';
import { useLogs } from '../../../hooks/useLogs';

const ACOES = Object.keys(ROTULO_DE_ACAO) as AcaoLog[];

const CLASSE_CABECALHO =
  'py-3 pr-4 text-left font-display text-xs font-bold uppercase tracking-widest text-grafite';

function ehAcaoValida(valor: string): valor is AcaoLog {
  return (ACOES as string[]).includes(valor);
}

function nomeDoAutor(usuarioId: string): string {
  return usuarios.find((usuario) => usuario.id === usuarioId)?.nome ?? 'Usuário removido';
}

/**
 * Registro de atividade — mais recente primeiro, filtro por ação e por
 * usuário, estado na URL. Só `admin` acessa (gate em `AreaProtegida`).
 */
function Logs() {
  const [parametros, setParametros] = useSearchParams();
  const { logs } = useLogs();

  const acaoBruta = parametros.get('acao') ?? '';
  const filtros = {
    acao: ehAcaoValida(acaoBruta) ? acaoBruta : ('' as const),
    usuarioId: parametros.get('usuario') ?? '',
  };

  const resultado = filtrarLogs(logs, filtros);

  const definirAcao = (valor: string) => {
    const proximos = new URLSearchParams(parametros);
    if (valor === '') proximos.delete('acao');
    else proximos.set('acao', valor);
    setParametros(proximos);
  };

  const definirUsuario = (valor: string) => {
    const proximos = new URLSearchParams(parametros);
    if (valor === '') proximos.delete('usuario');
    else proximos.set('usuario', valor);
    setParametros(proximos);
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Logs</h1>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <label htmlFor="filtro-acao" className="sr-only">
            Filtrar por ação
          </label>
          <select
            id="filtro-acao"
            value={filtros.acao}
            onChange={(evento) => definirAcao(evento.target.value)}
            className="border border-grafite/40 bg-white px-3 py-2 text-sm text-tinta"
          >
            <option value="">Todas as ações</option>
            {ACOES.map((acao) => (
              <option key={acao} value={acao}>
                {ROTULO_DE_ACAO[acao]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-usuario" className="sr-only">
            Filtrar por usuário
          </label>
          <select
            id="filtro-usuario"
            value={filtros.usuarioId}
            onChange={(evento) => definirUsuario(evento.target.value)}
            className="border border-grafite/40 bg-white px-3 py-2 text-sm text-tinta"
          >
            <option value="">Todos os usuários</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p aria-live="polite" className="mt-6 font-mono text-xs uppercase tracking-widest text-grafite">
        {resultado.length} {resultado.length === 1 ? 'registro' : 'registros'}
      </p>

      {resultado.length === 0 ? (
        <div className="mt-4 border border-grafite/25 bg-white px-6 py-16 text-center">
          <p className="font-display text-lg font-bold tracking-tight text-tinta">
            Nenhum registro com esses filtros.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-grafite">
            Tente outra ação ou outro usuário.
          </p>
          <button
            type="button"
            onClick={() => setParametros(new URLSearchParams())}
            className="mt-6 border border-tinta px-5 py-2 font-display text-sm font-semibold text-tinta transition-colors hover:bg-tinta hover:text-papel"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse">
            <caption className="sr-only">Registro de atividade</caption>
            <thead>
              <tr className="border-b border-grafite/30">
                <th scope="col" className={CLASSE_CABECALHO}>
                  Autor
                </th>
                <th scope="col" className={CLASSE_CABECALHO}>
                  Ação
                </th>
                <th scope="col" className={CLASSE_CABECALHO}>
                  Entidade
                </th>
                <th scope="col" className={CLASSE_CABECALHO}>
                  Descrição
                </th>
                <th scope="col" className={CLASSE_CABECALHO}>
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {resultado.map((log) => (
                <tr key={log.id} className="border-b border-grafite/20">
                  <td className="py-3 pr-4 text-sm text-tinta">{nomeDoAutor(log.usuarioId)}</td>
                  <td className="py-3 pr-4 text-sm text-tinta">{ROTULO_DE_ACAO[log.acao]}</td>
                  <td className="py-3 pr-4 font-mono text-xs uppercase tracking-wide text-grafite">
                    {log.entidade}
                  </td>
                  <td className="py-3 pr-4 text-sm text-grafite">{log.descricao}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-grafite">{formatarData(log.em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Logs;
