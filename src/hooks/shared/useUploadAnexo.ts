import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TAMANHO_MAX_MB = 10;
const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

interface UploadParams {
  arquivo: File;
  sociedadeId: string;
  /** subpasta lógica dentro da sociedade, ex.: "contribuicoes" / "solicitacoes-nota" */
  pasta: string;
}

export function useUploadAnexo() {
  const [enviando, setEnviando] = useState(false);

  const upload = async ({ arquivo, sociedadeId, pasta }: UploadParams): Promise<string | null> => {
    if (arquivo.size > TAMANHO_MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo maior que ${TAMANHO_MAX_MB} MB`);
      return null;
    }
    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
      toast.error("Tipo de arquivo não suportado", {
        description: "Use JPG, PNG, WEBP, HEIC ou PDF.",
      });
      return null;
    }

    setEnviando(true);
    const ext = arquivo.name.split(".").pop()?.toLowerCase() ?? "bin";
    const nome = `${crypto.randomUUID()}.${ext}`;
    const caminho = `${sociedadeId}/${pasta}/${nome}`;

    const { error } = await supabase.storage.from("anexos").upload(caminho, arquivo, {
      cacheControl: "3600",
      upsert: false,
      contentType: arquivo.type,
    });
    setEnviando(false);

    if (error) {
      toast.error("Falha no upload", { description: error.message });
      return null;
    }
    return caminho;
  };

  const obterUrlAssinada = async (caminho: string, expiraSegundos = 60 * 10) => {
    if (/^https?:\/\//i.test(caminho)) return caminho;

    const { data, error } = await supabase.storage
      .from("anexos")
      .createSignedUrl(caminho, expiraSegundos);
    if (error) {
      toast.error("Não foi possível abrir o anexo", { description: error.message });
      return null;
    }
    return data.signedUrl;
  };

  const abrirAnexo = async (caminho: string) => {
    const aba = window.open("", "_blank");
    if (!aba) {
      toast.error("O navegador bloqueou a abertura do anexo.");
      return;
    }

    aba.document.write(
      "<title>Abrindo anexo...</title><body style='font-family:system-ui;padding:24px'>Abrindo anexo...</body>",
    );

    const url = await obterUrlAssinada(caminho);
    if (!url) {
      aba.close();
      return;
    }

    aba.location.replace(url);
    setTimeout(() => {
      try {
        aba.opener = null;
      } catch {
        // Ignora navegadores que não permitem alterar opener após o redirecionamento.
      }
    }, 0);
  };

  const remover = async (caminho: string) => {
    const { error } = await supabase.storage.from("anexos").remove([caminho]);
    if (error) {
      toast.error("Falha ao remover anexo", { description: error.message });
      return false;
    }
    return true;
  };

  return { upload, obterUrlAssinada, abrirAnexo, remover, enviando };
}
