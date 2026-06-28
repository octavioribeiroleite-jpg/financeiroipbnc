import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, ImageIcon, Loader2, Paperclip, Trash2, ExternalLink } from "lucide-react";
import { useUploadAnexo } from "@/hooks/shared/useUploadAnexo";

interface UploadAnexoProps {
  sociedadeId: string;
  pasta: string;
  /** Caminho atual já salvo (ex.: "uuid/contribuicoes/file.pdf"). */
  caminho: string | null;
  onChange: (caminho: string | null) => void;
  rotulo?: string;
  disabled?: boolean;
}

export function UploadAnexo({
  sociedadeId,
  pasta,
  caminho,
  onChange,
  rotulo = "Anexar arquivo",
  disabled,
}: UploadAnexoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, obterUrlAssinada, remover, enviando } = useUploadAnexo();
  const [dragOver, setDragOver] = useState(false);

  const enviar = async (arquivo: File) => {
    const novo = await upload({ arquivo, sociedadeId, pasta });
    if (novo) {
      // Se já existia um anexo, remove o antigo para não acumular lixo.
      if (caminho) await remover(caminho);
      onChange(novo);
    }
  };

  const abrir = async () => {
    if (!caminho) return;
    // Abrimos a janela imediatamente (gesto do usuário) para evitar bloqueio
    // de popup do navegador. Em seguida atualizamos a URL com a assinada.
    const janela = window.open("", "_blank");
    if (janela) {
      janela.opener = null;
      janela.document.write("<p style='font-family: system-ui; padding: 24px'>Abrindo anexo...</p>");
      janela.document.close();
    }
    const url = await obterUrlAssinada(caminho);
    if (!url) {
      janela?.close();
      return;
    }
    if (janela) {
      janela.location.href = url;
    } else {
      // Popup bloqueado: força download/abertura via link temporário
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const limpar = async () => {
    if (caminho) await remover(caminho);
    onChange(null);
  };

  const nome = caminho ? caminho.split("/").pop() : null;
  const isImagem = nome ? /\.(png|jpe?g|webp|heic)$/i.test(nome) : false;

  if (caminho) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 p-2">
        <div className="flex min-w-0 items-center gap-2">
          {isImagem ? (
            <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-sm">{nome}</span>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={abrir}>
            <ExternalLink className="h-4 w-4" />
          </Button>
          {!disabled && (
            <Button type="button" variant="ghost" size="sm" onClick={limpar}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const arquivo = e.dataTransfer.files?.[0];
        if (arquivo) enviar(arquivo);
      }}
      className={`flex flex-col items-center justify-center rounded-md border border-dashed p-4 text-center transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
      }`}
    >
      <Paperclip className="mb-2 h-5 w-5 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">
        Arraste um arquivo aqui ou clique para selecionar.
      </p>
      <p className="mb-2 text-[11px] text-muted-foreground">JPG, PNG, WEBP, HEIC ou PDF · até 10 MB</p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || enviando}
        onClick={() => inputRef.current?.click()}
      >
        {enviando ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
        {rotulo}
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) enviar(arquivo);
          e.target.value = "";
        }}
      />
    </div>
  );
}
