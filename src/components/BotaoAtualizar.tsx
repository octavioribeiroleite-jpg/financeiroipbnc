import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BotaoAtualizarProps {
  className?: string;
}

export function BotaoAtualizar({ className }: BotaoAtualizarProps) {
  const [carregando, setCarregando] = useState(false);

  const atualizar = async () => {
    if (carregando) return;
    setCarregando(true);
    toast.loading("Limpando cache e atualizando…", { id: "atualizar-app" });

    try {
      if ("caches" in window) {
        const chaves = await caches.keys();
        await Promise.all(chaves.map((chave) => caches.delete(chave)));
      }

      if ("serviceWorker" in navigator) {
        const registros = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registros.map((registro) => registro.unregister()));
      }
    } catch (erro) {
      console.error("Falha ao limpar cache", erro);
    } finally {
      const url = new URL(window.location.href);
      url.searchParams.set("_r", Date.now().toString());
      window.location.replace(url.toString());
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={atualizar}
      aria-label="Atualizar aplicativo"
      title="Limpar cache e buscar atualizações"
      className={cn("h-9 w-9 rounded-xl sm:h-10 sm:w-10", className)}
      disabled={carregando}
    >
      <RefreshCw className={cn("h-[18px] w-[18px]", carregando && "animate-spin")} />
    </Button>
  );
}
