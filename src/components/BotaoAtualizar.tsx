import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function BotaoAtualizar() {
  const [carregando, setCarregando] = useState(false);

  const atualizar = async () => {
    if (carregando) return;
    setCarregando(true);
    toast.loading("Limpando cache e atualizando…", { id: "atualizar-app" });
    try {
      // Limpa caches do Service Worker / browser
      if ("caches" in window) {
        const chaves = await caches.keys();
        await Promise.all(chaves.map((k) => caches.delete(k)));
      }
      // Remove service workers registrados
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (err) {
      console.error("Falha ao limpar cache", err);
    } finally {
      // Recarrega forçando busca da versão nova
      const url = new URL(window.location.href);
      url.searchParams.set("_r", Date.now().toString());
      window.location.replace(url.toString());
    }
  };

  return (
    <button
      type="button"
      onClick={atualizar}
      aria-label="Atualizar aplicativo"
      title="Limpar cache e buscar atualizações"
      className="fixed bottom-4 right-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:bg-primary/90 active:scale-95 disabled:opacity-70"
      disabled={carregando}
    >
      <RefreshCw className={`h-5 w-5 ${carregando ? "animate-spin" : ""}`} />
    </button>
  );
}
