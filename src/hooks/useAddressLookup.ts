import { useCallback, useState } from "react";

export interface EnderecoViaCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface ViaCepResponse {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}
export function useAddressLookup() {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = useCallback(async (cep: string): Promise<EnderecoViaCep | null> => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return null;

    setLoading(true);
    setErro(null);

    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await res.json()) as ViaCepResponse;

      if (data.erro) {
        setErro("CEP não encontrado. Preencha o endereço manualmente.");
        return null;
      }

      return {
        logradouro: data.logradouro ?? "",
        bairro: data.bairro ?? "",
        cidade: data.localidade ?? "",
        uf: data.uf ?? "",
      };
    } catch {
      setErro("Não foi possível buscar o CEP agora. Preencha manualmente.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { buscar, loading, erro };
}