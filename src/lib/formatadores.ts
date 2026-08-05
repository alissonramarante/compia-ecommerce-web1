/**
 * Formatação para exibição. Nada aqui calcula regra de negócio: só traduz
 * dado cru (centavos, ISO, dígitos) para o formato que o leitor brasileiro
 * espera. Todas as funções são puras.
 */

/* ------------------------------------------------------------------ */
/* 1. Dinheiro                                                         */
/* ------------------------------------------------------------------ */

const moedaBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Converte centavos inteiros em reais legíveis.
 *
 * O `Intl` devolve um espaço não separável (U+00A0) depois do "R$"; ele é
 * trocado por espaço comum para o texto ser previsível em teste e em busca.
 *
 * Testes de mesa:
 *   formatarMoeda(0)        → 'R$ 0,00'
 *   formatarMoeda(990)      → 'R$ 9,90'
 *   formatarMoeda(6900)     → 'R$ 69,00'
 *   formatarMoeda(129900)   → 'R$ 1.299,00'
 *   formatarMoeda(1234567)  → 'R$ 12.345,67'
 *   formatarMoeda(-500)     → '-R$ 5,00'
 *
 * @param centavos Valor em centavos. Fração é arredondada — o domínio só
 *                 trabalha com inteiros, isto é defesa contra float.
 */
export function formatarMoeda(centavos: number): string {
  if (!Number.isFinite(centavos)) return 'R$ 0,00';

  const reais = Math.round(centavos) / 100;
  return moedaBRL.format(reais).replace(/[\u00A0\u202F]/g, ' ');
}

/* ------------------------------------------------------------------ */
/* 2. Datas                                                            */
/* ------------------------------------------------------------------ */

const SOMENTE_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

const dataBR = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * Converte data ISO 8601 em DD/MM/AAAA.
 *
 * Duas passagens, porque os dois formatos aparecem no domínio:
 *   1. `AAAA-MM-DD` puro é formatado pelos próprios dígitos — não passa por
 *      fuso, senão "2026-02-19" viraria 18/02 no horário de Brasília.
 *   2. Timestamp completo é convertido para America/Sao_Paulo, e não para o
 *      fuso da máquina, para o resultado não depender de onde roda.
 *
 * Testes de mesa:
 *   formatarData('2026-02-19T21:14:00Z') → '19/02/2026'
 *   formatarData('2026-02-19T02:00:00Z') → '18/02/2026'  (23h de 18/02 em Brasília)
 *   formatarData('2026-02-19')           → '19/02/2026'
 *   formatarData('2026-12-31T23:59:59Z') → '31/12/2026'
 *   formatarData('')                     → '—'
 *   formatarData('ontem')                → '—'
 */
export function formatarData(iso: string): string {
  // 1. Data sem hora: formata literal, sem conversão de fuso.
  const partes = SOMENTE_DATA.exec(iso);
  if (partes) {
    const [, ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  // 2. Timestamp completo: sempre lido no fuso da editora.
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';

  return dataBR.format(data);
}

/* ------------------------------------------------------------------ */
/* 3. CEP                                                              */
/* ------------------------------------------------------------------ */

/**
 * Máscara de CEP. Aceita entrada suja (pontos, hífen, espaço) porque é usada
 * enquanto a pessoa digita: com menos de 6 dígitos devolve o que tem, sem
 * hífen, para o campo não brigar com quem está no meio da digitação.
 *
 * Testes de mesa:
 *   formatarCep('58429900')     → '58429-900'
 *   formatarCep('58429-900')    → '58429-900'
 *   formatarCep(' 58.429-900 ') → '58429-900'
 *   formatarCep('584299001')    → '58429-900'  (excedente descartado)
 *   formatarCep('58429')        → '58429'
 *   formatarCep('584')          → '584'
 *   formatarCep('')             → ''
 *   formatarCep('abc')          → ''
 */
export function formatarCep(cep: string): string {
  const digitos = cep.replace(/\D/g, '').slice(0, 8);

  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

/* ------------------------------------------------------------------ */
/* 4. CPF                                                              */
/* ------------------------------------------------------------------ */

/**
 * Mascara o CPF preservando o miolo, que é o que a pessoa usa para
 * reconhecer o próprio documento. Esconde os três primeiros dígitos e os
 * dois do verificador.
 *
 * Aceita entrada com ou sem pontuação e sempre devolve pontuada.
 *
 * Testes de mesa:
 *   mascararCpf('123.456.789-00') → '***.456.789-**'
 *   mascararCpf('12345678900')    → '***.456.789-**'
 *   mascararCpf('987.654.321-00') → '***.654.321-**'
 *   mascararCpf('123')            → '***.***.***-**'  (curto: esconde tudo)
 *   mascararCpf('')               → '***.***.***-**'
 */
export function mascararCpf(cpf: string): string {
  const digitos = cpf.replace(/\D/g, '');
  if (digitos.length !== 11) return '***.***.***-**';

  return `***.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-**`;
}

/**
 * CPF por extenso, pontuado. Usado só quando a pessoa pede para revelar.
 *
 * Testes de mesa:
 *   formatarCpf('12345678900')    → '123.456.789-00'
 *   formatarCpf('123.456.789-00') → '123.456.789-00'
 *   formatarCpf('123')            → '123'   (devolve o que veio, sem inventar)
 */
export function formatarCpf(cpf: string): string {
  const digitos = cpf.replace(/\D/g, '');
  if (digitos.length !== 11) return cpf;

  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

/**
 * Resumo plural para a região viva única de erro de formulário — a única
 * coisa que ela anuncia, além de mudanças sem campo dono. Erro de campo
 * mesmo é anunciado por `aria-describedby`, ao receber foco.
 *
 * Testes de mesa:
 *   mensagemDeResumoDeErros(0) → '0 campos precisam de correção'
 *   mensagemDeResumoDeErros(1) → '1 campo precisa de correção'
 *   mensagemDeResumoDeErros(3) → '3 campos precisam de correção'
 */
export function mensagemDeResumoDeErros(quantidade: number): string {
  return quantidade === 1
    ? '1 campo precisa de correção'
    : `${quantidade} campos precisam de correção`;
}
