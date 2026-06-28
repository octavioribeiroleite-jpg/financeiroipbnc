import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const VERSION_ATUAL = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
const INTERVALO_MS = 60_000;

async function buscarVersaoRemota(): Promise<string | null> {
  try {
    const resposta = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!resposta.ok) return null;
    const dados = (await resposta.json()) as { version?: string };
    return dados.version ?? null;
  } catch {
    return null;
  }
}

async function limparCacheERecarregar() {
  try {
    if ("caches" in window) {
      const chaves = await caches.keys();
      await Promise.all(chaves.map((c) => caches.delete(c)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (erro) {
    console.error("Falha ao limpar cache", erro);
  } finally {
    const url = new URL(window.location.href);
    url.searchParams.set("_r", Date.now().toString());
    window.location.replace(url.toString());
  }
}

export function AvisoNovaVersao() {
  const [novaVersao, setNovaVersao] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    let cancelado = false;

    const verificar = async () => {
      const remota = await buscarVersaoRemota();
      if (!cancelado && remota && remota !== VERSION_ATUAL) setNovaVersao(true);
    };

    verificar();
    const id = window.setInterval(verificar, INTERVALO_MS);
    const aoFocar = () => verificar();
    window.addEventListener("focus", aoFocar);
    document.addEventListener("visibilitychange", aoFocar);

    return () => {
      cancelado = true;
      window.clearInterval(id);
      window.removeEventListener("focus", aoFocar);
      document.removeEventListener("visibilitychange", aoFocar);
    };
  }, []);

  if (!novaVersao) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-brand-gold-400/40 bg-brand-navy-900 px-4 py-3 text-white shadow-elevated">
        <RefreshCw className="h-5 w-5 shrink-0 text-brand-gold-400" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold leading-tight">Nova versão disponível</p>
          <p className="text-xs text-white/70">Atualize para receber as últimas melhorias.</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={limparCacheERecarregar}
          className="bg-brand-gold-500 text-brand-navy-900 hover:bg-brand-gold-400"
        >
          Atualizar
        </Button>
      </div>
    </div>
  );
}
