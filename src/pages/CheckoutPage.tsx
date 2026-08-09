import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CreditCard, Loader2, QrCode, ShieldCheck } from "lucide-react";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { formatCep, formatCpf, formatCurrency } from "@/lib/format";

import { useShipping } from "@/hooks/useShipping";
import { useAddressLookup } from "@/hooks/useAddressLookup";
import { orderService } from "@/services";
import { useCart } from "@/store/cart";
import type { Pedido } from "@/types";

type Etapa = 1 | 2 | 3;
type Pagamento = "pix" | "cartao";

export default function Checkout() {
  const navigate = useNavigate();

  const { items, subtotal, hasFisico, clear } = useCart();

  const shipping = useShipping();
  const addressLookup = useAddressLookup();

  const [etapa, setEtapa] = useState<Etapa>(1);

  const [pagamento, setPagamento] = useState<Pagamento>("pix");

  const [processando, setProcessando] = useState(false);

  const [dados, setDados] = useState({
    nome: "",
    email: "",
    cpf: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    observacoes: "",
  });

  const frete = hasFisico ? (shipping.selection?.valor ?? 0) : 0;

  const total = subtotal + frete;

  const pixPayload = useMemo(
    () => `00020126COMPIA-PIX-SIMULADO-${total.toFixed(2)}-${Date.now()}`,
    [total],
  );

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setDados((prev) => ({ ...prev, cep: formatted }));

    if (formatted.replace(/\D/g, "").length !== 8) return;

    // Calcula o frete (tabela local) e busca o endereço (ViaCEP) em paralelo.
    const [, endereco] = await Promise.all([
      shipping.calcular(formatted),
      addressLookup.buscar(formatted),
    ]);

    if (endereco) {
      setDados((prev) => ({
        ...prev,
        logradouro: endereco.logradouro || prev.logradouro,
        bairro: endereco.bairro || prev.bairro,
        cidade: endereco.cidade || prev.cidade,
        uf: endereco.uf || prev.uf,
      }));
    }
  };

  // Se o usuário já informou o CEP no carrinho (shipping.selection persistido),
  // reaproveita esse CEP no checkout em vez de pedir de novo — pré-preenche
  // frete + endereço assim que o valor salvo estiver disponível.
  useEffect(() => {
    if (hasFisico && shipping.selection?.cep && !dados.cep) {
      void handleCepChange(shipping.selection.cep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFisico, shipping.selection?.cep]);

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

  const identificacaoOk =
    dados.nome.trim().length > 2 &&
    /\S+@\S+\.\S+/.test(dados.email) &&
    dados.cpf.replace(/\D/g, "").length === 11;

  const enderecoOk =
    dados.cep.replace(/\D/g, "").length === 8 &&
    dados.logradouro.trim().length > 2 &&
    dados.numero.trim().length > 0 &&
    dados.bairro.trim().length > 1 &&
    dados.cidade.trim().length > 1 &&
    dados.uf.trim().length === 2 &&
    !!shipping.selection;

  const dadosOk = identificacaoOk && (!hasFisico || enderecoOk);

  const enderecoFormatado = [
    `${dados.logradouro}, ${dados.numero}${dados.complemento ? ` - ${dados.complemento}` : ""}`,
    `${dados.bairro} - ${dados.cidade}/${dados.uf}`,
    `CEP ${dados.cep}`,
  ].join(" | ");

  const continuarIdentificacao = () => {
    if (!identificacaoOk) return;
    if (hasFisico) {
      setEtapa(2);
    } else {
      setEtapa(3);
    }
  };

  const finalizar = async () => {
    setProcessando(true);

    const pedido: Pedido = {
      id: `PED-${Date.now().toString().slice(-6)}`,

      data: new Date().toISOString(),

      cliente: dados.nome,

      email: dados.email,

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

      ...(hasFisico ? { endereco: enderecoFormatado } : {}),
    };
    await new Promise((resolve) => setTimeout(resolve, 1200));

    await orderService.createOrder(pedido);

    window.localStorage.setItem("compia:ultimoPedido", JSON.stringify(pedido));

    clear();

    setProcessando(false);

    navigate("/pedido/sucesso");
  };
  const etapas = hasFisico
    ? [
        {
          etapa: 1 as const,
          numero: 1,
          nome: "Identificação",
        },
        {
          etapa: 2 as const,
          numero: 2,
          nome: "Entrega",
        },
        {
          etapa: 3 as const,
          numero: 3,
          nome: "Pagamento",
        },
      ]
    : [
        {
          etapa: 1 as const,
          numero: 1,
          nome: "Identificação",
        },
        {
          etapa: 3 as const,
          numero: 2,
          nome: "Pagamento",
        },
      ];

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Finalizar compra</h1>
        <ol className="mt-6 flex flex-wrap gap-3 text-sm">
          {etapas.map(({ etapa: etapaNumero, numero, nome }) => {
            const ativo = etapa === etapaNumero;

            return (
              <li key={nome}>
                <button
                  type="button"
                  onClick={() => setEtapa(etapaNumero)}
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
                      onChange={(e) =>
                        setDados({
                          ...dados,
                          nome: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail</Label>

                    <Input
                      id="email"
                      type="email"
                      value={dados.email}
                      onChange={(e) =>
                        setDados({
                          ...dados,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF</Label>

                    <Input
                      id="cpf"
                      inputMode="numeric"
                      value={dados.cpf}
                      onChange={(e) =>
                        setDados({
                          ...dados,
                          cpf: formatCpf(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                {!identificacaoOk && (
                  <p className="text-sm text-destructive">
                    Preencha nome, e-mail e CPF válidos para continuar.
                  </p>
                )}

                <Button onClick={continuarIdentificacao} disabled={!identificacaoOk}>
                  Continuar
                </Button>
              </div>
            )}
            {etapa === 2 && hasFisico && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold">Entrega</h2>

                <div>
                  <Label htmlFor="cepEntrega">CEP</Label>

                  <div className="relative">
                    <Input
                      id="cepEntrega"
                      inputMode="numeric"
                      placeholder="00000-000"
                      value={dados.cep}
                      onChange={(e) => void handleCepChange(e.target.value)}
                    />

                    {(shipping.loading || addressLookup.loading) && (
                      <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Buscamos automaticamente o endereço e calculamos o frete a partir do CEP.
                  </p>

                  {addressLookup.erro && (
                    <p className="mt-1 text-sm text-destructive">{addressLookup.erro}</p>
                  )}

                  {shipping.erro && (
                    <p className="mt-1 text-sm text-destructive">{shipping.erro}</p>
                  )}

                  {shipping.selection && (
                    <p className="mt-2 text-sm">
                      Frete para <strong>{shipping.selection.nomeEstado}</strong>:{" "}
                      <strong>{formatCurrency(shipping.selection.valor)}</strong>
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Label htmlFor="logradouro">Logradouro</Label>

                    <Input
                      id="logradouro"
                      value={dados.logradouro}
                      onChange={(e) =>
                        setDados({ ...dados, logradouro: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="numero">Número</Label>

                    <Input
                      id="numero"
                      value={dados.numero}
                      onChange={(e) => setDados({ ...dados, numero: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="complemento">Complemento (opcional)</Label>

                    <Input
                      id="complemento"
                      value={dados.complemento}
                      onChange={(e) =>
                        setDados({ ...dados, complemento: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="bairro">Bairro</Label>

                    <Input
                      id="bairro"
                      value={dados.bairro}
                      onChange={(e) => setDados({ ...dados, bairro: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cidade">Cidade</Label>

                    <Input
                      id="cidade"
                      value={dados.cidade}
                      onChange={(e) => setDados({ ...dados, cidade: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="uf">UF</Label>

                    <Input
                      id="uf"
                      maxLength={2}
                      value={dados.uf}
                      onChange={(e) =>
                        setDados({ ...dados, uf: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="obs">Observações (opcional)</Label>

                  <Textarea
                    id="obs"
                    value={dados.observacoes}
                    onChange={(e) =>
                      setDados({
                        ...dados,
                        observacoes: e.target.value,
                      })
                    }
                  />
                </div>

                {!enderecoOk && (
                  <p className="text-sm text-destructive">
                    Informe um CEP válido e complete o endereço para calcular o frete e continuar.
                  </p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEtapa(1)}>
                    Voltar
                  </Button>

                  <Button onClick={() => setEtapa(3)} disabled={!enderecoOk}>
                    Ir para pagamento
                  </Button>
                </div>
              </div>
            )}
            {etapa === 3 && (
              <div className="space-y-5">
                <h2 className="font-display text-lg font-semibold">Pagamento</h2>
                {!hasFisico && (
                  <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                    <p className="font-medium text-success">Entrega digital imediata</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Este pedido contém apenas materiais digitais. Não é necessário informar
                      endereço de entrega e não há cobrança de frete.
                    </p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        id: "pix",
                        label: "PIX",
                        desc: "Aprovação imediata",
                        Icon: QrCode,
                      },
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

                      <Input
                        id="cartaoNumero"
                        placeholder="0000 0000 0000 0000"
                        inputMode="numeric"
                      />
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
                    Complete seus dados
                    {hasFisico ? ", o endereço e o cálculo de frete" : ""} para concluir o pedido.
                  </p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEtapa(hasFisico ? 2 : 1)}>
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
                  {hasFisico ? formatCurrency(frete) : "R$ 0,00"}
                </span>
              </div>
            </div>

            {!hasFisico && (
              <p className="mt-2 text-xs text-success">
                Entrega digital imediata, sem cobrança de frete.
              </p>
            )}

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <span className="font-display font-semibold">Total</span>

              <span className="font-display text-xl font-bold tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success" />
              Ambiente de demonstração, sem cobrança real.
            </p>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
