import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "config_igreja_v1";

export interface ConfigIgreja {
  nome: string;
  subtitulo: string;
  endereco: string;
  cidadeUf: string;
  cnpj: string;
  logoDataUrl: string | null; // base64 dataURL para o PDF não depender de URL externa
}

const DEFAULT: ConfigIgreja = {
  nome: "Igreja Presbiteriana",
  subtitulo: "Tesouraria",
  endereco: "",
  cidadeUf: "",
  cnpj: "",
  logoDataUrl: null,
};

export function lerConfigIgreja(): ConfigIgreja {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<ConfigIgreja>;
    return { ...DEFAULT, ...parsed };
  } catch {
    return DEFAULT;
  }
}

export function useConfigIgreja() {
  const [config, setConfig] = useState<ConfigIgreja>(() => lerConfigIgreja());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setConfig(lerConfigIgreja());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const salvar = useCallback((novo: ConfigIgreja) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(novo));
    setConfig(novo);
  }, []);

  return { config, salvar };
}

/** Converte um File de imagem (PNG/JPG) para dataURL base64. */
export function arquivoParaDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
