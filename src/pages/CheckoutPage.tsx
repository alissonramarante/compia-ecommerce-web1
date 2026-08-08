import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CreditCard, QrCode, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ShippingCalculator } from "@/components/checkout/ShippingCalculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCep, formatCpf, formatCurrency } from "@/lib/format";
import { useShipping } from "@/hooks/useShipping";
import { orderService } from "@/services";
import { useCart } from "@/store/cart";
import type { Pedido } from "@/types";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, hasFisico, clear } = useCart();
  const shipping = useShipping();
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [pagamento, setPagamento] = useState<Pagamento>("pix");
  const [processando, setProcessando] = useState(false);
  const [dados, setDados] = useState({
    nome: "",
    email: "",
    cpf: "",
    cep: "",
    endereco: "",
    observacoes: "",
  });

  const frete = hasFisico ? (shipping.selection?.valor ?? 0) : 0;
  const total = subtotal + frete;
  const pixPayload = useMemo(
    () => `00020126COMPIA-PIX-SIMULADO-${total.toFixed(2)}-${Date.now()}`,
    [total],
  );

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold">Nada para finalizar</h1>
          <p className="text-muted-foreground">Adicione materiais ao carrinho para continuar.</p>
          <Button asChild>
            <Link to="/produtos">Ver catálogo</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const dadosOk =
    dados.nome.trim().length > 2 &&
    /\S+@\S+\.\S+/.test(dados.email) &&
    dados.cpf.replace(/\D/g, "").length === 11 &&
    (!hasFisico || (dados.endereco.trim().length > 5 && !!shipping.selection));

  const finalizar = async () => {
    setProcessando(true);
    const pedido: Pedido = {
      id: `PED-${Date.now().toString().slice(-6)}`,
      data: new Date().toISOString(),
      cliente: dados.nome,
      status: pagamento === "pix" ? "aprovado" : "preparacao",
      pagamento,
      total,
      itens: items.map((i) => ({
        produtoId: i.produto.id,
        titulo: i.produto.titulo,
        quantidade: i.quantidade,
        valor: i.produto.valor,
        formato: i.produto.formato,
      })),
    };
    await new Promise((r) => setTimeout(r, 1200));
    await orderService.createOrder(pedido);
    window.localStorage.setItem("compia:ultimoPedido", JSON.stringify(pedido));
    clear();
    setProcessando(false);
    navigate("/pedido/sucesso");
  };

  const etapas = ["Identificação", "Entrega", "Pagamento"];

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Finalizar compra</h1>

        <ol className="mt-6 flex flex-wrap gap-3 text-sm">
          {etapas.map((nome, i) => {
            const numero = (i + 1) as 1 | 2 | 3;
            const ativo = etapa === numero;
            return (
              <li key={nome}>
                <button
                  type="button"
                  onClick={() => setEtapa(numero)}
                  className={
                    ativo
                      ? "rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground"
                      : "rounded-full border px-4 py-1.5 text-muted-foreground"
                  }
                >
                  {numero}. {nome}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="surface-card p-6">
            {etapa === 1 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold">Seus dados</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      value={dados.nome}
                      onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={dados.email}
                      onChange={(e) => setDados({ ...dados, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      inputMode="numeric"
                      value={dados.cpf}
                      onChange={(e) => setDados({ ...dados, cpf: formatCpf(e.target.value) })}
                    />
                  </div>
                </div>
                <Button onClick={() => setEtapa(2)}>Continuar</Button>
              </div>
            )}

            {etapa === 2 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold">Entrega</h2>
                {hasFisico ? (
                  <>
                    <ShippingCalculator shipping={shipping} compact />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="cepEntrega">CEP</Label>
                        <Input
                          id="cepEntrega"
                          value={dados.cep || (shipping.selection?.cep ?? "")}
                          onChange={(e) => setDados({ ...dados, cep: formatCep(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endereco">Endereço completo</Label>
                        <Input
                          id="endereco"
                          placeholder="Rua, número, bairro, cidade"
                          value={dados.endereco}
                          onChange={(e) => setDados({ ...dados, endereco: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Pedido totalmente digital: enviaremos os arquivos para{" "}
                    <strong>{dados.email || "seu e-mail"}</strong> e liberaremos o acesso na área de
                    downloads.
                  </p>
                )}
                <div>
                  <Label htmlFor="obs">Observações (opcional)</Label>
                  <Textarea
                    id="obs"
                    value={dados.observacoes}
                    onChange={(e) => setDados({ ...dados, observacoes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEtapa(1)}>
                    Voltar
                  </Button>
                  <Button onClick={() => setEtapa(3)}>Ir para pagamento</Button>
                </div>
              </div>
            )}

            {etapa === 3 && (
              <div className="space-y-5">
                <h2 className="font-display text-lg font-semibold">Pagamento</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      { id: "pix", label: "PIX", desc: "Aprovação imediata", Icon: QrCode },
                      {
                        id: "cartao",
                        label: "Cartão de crédito",
                        desc: "Em até 12x simuladas",
                        Icon: CreditCard,
                      },
                    ] as const
                  ).map(({ id, label, desc, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPagamento(id)}
                      className={
                        pagamento === id
                          ? "flex items-start gap-3 rounded-lg border-2 border-primary p-4 text-left"
                          : "flex items-start gap-3 rounded-lg border p-4 text-left"
                      }
                    >
                      <Icon className="mt-0.5 size-5 text-primary" />
                      <span>
                        <span className="block font-medium">{label}</span>
                        <span className="block text-sm text-muted-foreground">{desc}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {pagamento === "pix" ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border bg-secondary/40 p-6">
                    <QRCodeSVG value={pixPayload} size={168} />
                    <p className="text-sm text-muted-foreground">
                      QR Code simulado — nenhuma cobrança real é gerada.
                    </p>
                    <code className="max-w-full truncate rounded bg-background px-3 py-1 text-xs">
                      {pixPayload}
                    </code>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="cartaoNumero">Número do cartão</Label>
                      <Input id="cartaoNumero" placeholder="0000 0000 0000 0000" inputMode="numeric" />
                    </div>
                    <div>
                      <Label htmlFor="validade">Validade</Label>
                      <Input id="validade" placeholder="MM/AA" />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" inputMode="numeric" />
                    </div>
                  </div>
                )}

                {!dadosOk && (
                  <p className="text-sm text-destructive">
                    Complete seus dados{hasFisico ? ", o endereço e o cálculo de frete" : ""} para
                    concluir o pedido.
                  </p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEtapa(2)}>
                    Voltar
                  </Button>
                  <Button disabled={!dadosOk || processando} onClick={() => void finalizar()}>
                    {processando ? "Processando pagamento..." : "Confirmar pedido"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <aside className="surface-card h-fit p-5">
            <h2 className="font-display text-base font-semibold">Resumo</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map(({ produto, quantidade }) => (
                <li key={produto.id} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    {quantidade}× {produto.titulo}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatCurrency(produto.valor * quantidade)}
                  </span>
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="tabular-nums">
                  {hasFisico ? formatCurrency(frete) : "Grátis"}
                </span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="font-display font-semibold">Total</span>
              <span className="font-display text-xl font-bold tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success" /> Ambiente de demonstração, sem cobrança
              real.
            </p>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
