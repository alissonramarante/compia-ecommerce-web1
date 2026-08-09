import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PixCopyButtonProps {
  payload: string;
  className?: string;
}

export function PixCopyButton({ payload, className }: PixCopyButtonProps) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = payload;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopiado(true);
      toast.success("Chave PIX copiada!");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar a chave. Copie manualmente.");
    }
  };

  return (
    <Button
      type="button"
      variant={copiado ? "secondary" : "default"}
      onClick={() => void copiar()}
      className={cn("w-full sm:w-auto", className)}
    >
      {copiado ? (
        <>
          <Check className="size-4" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="size-4" />
          Copiar chave PIX
        </>
      )}
    </Button>
  );
}
