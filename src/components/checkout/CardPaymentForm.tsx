import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardBrandIcon } from "@/components/checkout/CardBrandIcon";

import {
  cvvValido,
  detectarBandeira,
  formatarNumeroCartao,
  formatarValidade,
  gerarParcelas,
  nomeCartaoValido,
  validadeValida,
  validarLuhn,
} from "@/lib/card";

export interface DadosCartao {
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
  parcelas: number;
}

interface CardPaymentFormProps {
  total: number;
  onChange?: (dados: DadosCartao, valido: boolean) => void;
}

export function CardPaymentForm({ total, onChange }: CardPaymentFormProps) {
  const [numero, setNumero] = useState("");
  const [nome, setNome] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [tocado, setTocado] = useState({ numero: false, nome: false, validade: false, cvv: false });

  const numeroDigits = numero.replace(/\D/g, "");
  const bandeiraInfo = useMemo(() => detectarBandeira(numeroDigits), [numeroDigits]);
  const opcoesParcelas = useMemo(() => gerarParcelas(total, 12), [total]);
  const valorParcela = total > 0 && parcelas > 0 ? total / parcelas : 0;

  const numeroOk =
    numeroDigits.length >= 12 &&
    (bandeiraInfo.bandeira === "amex" ? numeroDigits.length === 15 : numeroDigits.length === 16) &&
    validarLuhn(numeroDigits);

  const nomeOk = nomeCartaoValido(nome);
  const validadeOk = validadeValida(validade);
  const cvvOk = cvvValido(cvv, bandeiraInfo.cvvLength);

  const valido = numeroOk && nomeOk && validadeOk && cvvOk && parcelas >= 1;

  useEffect(() => {
    onChange?.({ numero: numeroDigits, nome, validade, cvv, parcelas }, valido);
  }, [numeroDigits, nome, validade, cvv, parcelas, valido]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-secondary/30 p-4">
        <div className="flex items-center gap-3">
          <CardBrandIcon bandeira={bandeiraInfo.bandeira} className="size-9" />
          <div>
            <p className="font-mono text-sm tracking-wider">{numero || "•••• •••• •••• ••••"}</p>
            <p className="text-xs text-muted-foreground">
              {nome.trim() || "NOME NO CARTÃO"} · {validade || "MM/AA"}
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-muted-foreground">
          {numeroDigits.length > 0 ? bandeiraInfo.nome : "Bandeira"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="cartaoNumero">Número do cartão</Label>
          <Input
            id="cartaoNumero"
            placeholder="0000 0000 0000 0000"
            inputMode="numeric"
            value={numero}
            onChange={(e) => setNumero(formatarNumeroCartao(e.target.value))}
            onBlur={() => setTocado((t) => ({ ...t, numero: true }))}
            maxLength={23}
          />
          {tocado.numero && !numeroOk && (
            <p className="mt-1 text-xs text-destructive">
              {numeroDigits.length === 0
                ? "Informe o número do cartão."
                : "Número de cartão inválido."}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="cartaoNome">Nome impresso no cartão</Label>
          <Input
            id="cartaoNome"
            placeholder="Como está no cartão"
            value={nome}
            onChange={(e) => setNome(e.target.value.toUpperCase())}
            onBlur={() => setTocado((t) => ({ ...t, nome: true }))}
          />
          {tocado.nome && !nomeOk && (
            <p className="mt-1 text-xs text-destructive">Informe nome e sobrenome.</p>
          )}
        </div>

        <div>
          <Label htmlFor="validade">Validade</Label>
          <Input
            id="validade"
            placeholder="MM/AA"
            inputMode="numeric"
            value={validade}
            onChange={(e) => setValidade(formatarValidade(e.target.value))}
            onBlur={() => setTocado((t) => ({ ...t, validade: true }))}
            maxLength={5}
          />
          {tocado.validade && !validadeOk && (
            <p className="mt-1 text-xs text-destructive">Validade inválida ou vencida.</p>
          )}
        </div>

        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            placeholder={bandeiraInfo.cvvLength === 4 ? "1234" : "123"}
            inputMode="numeric"
            value={cvv}
            onChange={(e) =>
              setCvv(e.target.value.replace(/\D/g, "").slice(0, bandeiraInfo.cvvLength))
            }
            onBlur={() => setTocado((t) => ({ ...t, cvv: true }))}
            maxLength={bandeiraInfo.cvvLength}
          />
          {tocado.cvv && !cvvOk && (
            <p className="mt-1 text-xs text-destructive">
              CVV deve ter {bandeiraInfo.cvvLength} dígitos.
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="parcelas">Parcelamento</Label>
          <Select value={String(parcelas)} onValueChange={(v) => setParcelas(Number(v))}>
            <SelectTrigger id="parcelas">
              <SelectValue placeholder="Selecione o número de parcelas" />
            </SelectTrigger>
            <SelectContent>
              {opcoesParcelas.map((p) => (
                <SelectItem key={p.numero} value={String(p.numero)}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
