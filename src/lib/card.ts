import { formatCurrency } from "@/lib/format";

export type Bandeira =
  | "visa"
  | "mastercard"
  | "amex"
  | "elo"
  | "hipercard"
  | "diners"
  | "discover"
  | "desconhecida";

export interface BandeiraInfo {
  bandeira: Bandeira;
  nome: string;
  cvvLength: 3 | 4;
}

const PATTERNS: Array<{ bandeira: Bandeira; nome: string; cvvLength: 3 | 4; regex: RegExp }> = [
  {
    bandeira: "amex",
    nome: "American Express",
    cvvLength: 4,
    regex: /^3[47]/,
  },
  {
    bandeira: "diners",
    nome: "Diners Club",
    cvvLength: 3,
    regex: /^3(?:0[0-5]|[68])/,
  },
  {
    bandeira: "hipercard",
    nome: "Hipercard",
    cvvLength: 3,
    regex: /^(606282|3841)/,
  },
  {
    bandeira: "elo",
    nome: "Elo",
    cvvLength: 3,
    regex:
      /^(4011(78|79)|43(1274|8935)|45(1416|7393|763(1|2))|50(4175|6699|67[0-6][0-9]|677[0-8]|9\d{3})|627780|63(6297|6368)|650(03([^4])|04([0-9])|05(0|1)|4(0[5-9]|3[0-9]|8[5-9]|9[0-9])|5([0-2][0-9]|3[0-8])|9([0-6][0-9]|7[0-8])|541|700|720|901)|651652|655000|655021)/,
  },
  {
    bandeira: "discover",
    nome: "Discover",
    cvvLength: 3,
    regex: /^(6011|65|64[4-9]|622)/,
  },
  {
    bandeira: "mastercard",
    nome: "Mastercard",
    cvvLength: 3,
    regex: /^(5[1-5]|2[2-7])/,
  },
  {
    bandeira: "visa",
    nome: "Visa",
    cvvLength: 3,
    regex: /^4/,
  },
];

export const detectarBandeira = (numero: string): BandeiraInfo => {
  const digits = numero.replace(/\D/g, "");

  for (const padrao of PATTERNS) {
    if (padrao.regex.test(digits)) {
      return { bandeira: padrao.bandeira, nome: padrao.nome, cvvLength: padrao.cvvLength };
    }
  }

  return { bandeira: "desconhecida", nome: "Bandeira não identificada", cvvLength: 3 };
};

export const validarLuhn = (numero: string): boolean => {
  const digits = numero.replace(/\D/g, "");
  if (digits.length < 12) return false;

  let soma = 0;
  let dobrar = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (dobrar) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    soma += d;
    dobrar = !dobrar;
  }

  return soma % 10 === 0;
};

export const formatarNumeroCartao = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  const bandeira = detectarBandeira(digits);
  if (bandeira.bandeira === "amex") {
    return digits
      .slice(0, 15)
      .replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_m, a, b, c) =>
        [a, b, c].filter(Boolean).join(" "),
      );
  }

  return digits
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
};

export const formatarValidade = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export const validadeValida = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 4) return false;

  const mes = Number(digits.slice(0, 2));
  const ano = Number(`20${digits.slice(2)}`);

  if (mes < 1 || mes > 12) return false;

  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth() + 1;

  if (ano < anoAtual) return false;
  if (ano === anoAtual && mes < mesAtual) return false;

  return true;
};

export const cvvValido = (value: string, cvvLength: 3 | 4) =>
  value.replace(/\D/g, "").length === cvvLength;

export const nomeCartaoValido = (value: string) => value.trim().split(/\s+/).length >= 2;

export interface Parcela {
  numero: number;
  valor: number;
  label: string;
}

export const gerarParcelas = (total: number, maxParcelas = 12): Parcela[] => {
  if (total <= 0) return [];

  return Array.from({ length: maxParcelas }, (_, i) => {
    const numero = i + 1;
    const valor = total / numero;

    return {
      numero,
      valor,
      label:
        numero === 1
          ? `À vista — ${formatCurrency(valor)}`
          : `${numero}x de ${formatCurrency(valor)} sem juros`,
    };
  });
};