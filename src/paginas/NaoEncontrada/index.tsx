import MarcadorDePagina from '../../components/MarcadorDePagina';

/** Fora da lista de rotas da especificação, mas o roteador precisa de saída. */
function NaoEncontrada() {
  return <MarcadorDePagina nome="Página não encontrada" />;
}

export default NaoEncontrada;
