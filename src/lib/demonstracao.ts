/**
 * Restauração dos dados de demonstração.
 *
 * Depois de algumas compras de teste o `localStorage` acumula carrinhos,
 * sessão e pedidos criados. Isto apaga tudo que é nosso e devolve a loja ao
 * estado dos mocks.
 */

/** Tudo que o projeto grava começa com isto. */
export const PREFIXO_DAS_CHAVES = 'compia:';

/**
 * Chaves nossas presentes no armazenamento agora.
 *
 * Descobertas por varredura, **não** por lista fixa: uma chave nova
 * introduzida depois (o CRUD da Fatia 7, por exemplo) ficaria órfã numa
 * lista, e o reset passaria a mentir sobre o que limpa.
 *
 * Testes de mesa:
 *   armazenamento vazio                        → []
 *   3 chaves nossas + 2 de terceiros           → só as 3 nossas
 *   chave 'compia' sem os dois-pontos          → ignorada
 *   sem localStorage                           → []
 *   localStorage que lança                     → []
 */
export function chavesDaDemonstracao(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];

    const chaves: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);
      if (chave !== null && chave.startsWith(PREFIXO_DAS_CHAVES)) chaves.push(chave);
    }

    return chaves;
  } catch {
    return [];
  }
}

/**
 * Apaga as chaves e devolve quantas foram removidas.
 *
 * Não recarrega a página: quem decide isso é a tela. Assim a função
 * continua testável sem DOM.
 *
 * Testes de mesa:
 *   3 chaves nossas + 1 de terceiro → devolve 3, e a de terceiro sobrevive
 *   armazenamento vazio             → 0
 *   removeItem que lança            → 0, sem propagar
 */
export function restaurarDemonstracao(): number {
  const chaves = chavesDaDemonstracao();

  try {
    if (typeof localStorage === 'undefined') return 0;

    for (const chave of chaves) localStorage.removeItem(chave);

    return chaves.length;
  } catch {
    /* Armazenamento hostil: nada a restaurar, e nada pode quebrar. */
    return 0;
  }
}
