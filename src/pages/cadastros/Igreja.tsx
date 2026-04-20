import { useState } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useConfigIgreja,
  arquivoParaDataUrl,
  type ConfigIgreja,
} from "@/hooks/igreja/useConfigIgreja";
import { ImagePlus, Trash2 } from "lucide-react";

export default function ConfiguracoesIgreja() {
  const { config, salvar } = useConfigIgreja();
  const [form, setForm] = useState<ConfigIgreja>(config);
  const [salvando, setSalvando] = useState(false);

  const set = <K extends keyof ConfigIgreja>(k: K, v: ConfigIgreja[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onUpload = async (file: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      toast.error("Use uma imagem PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Imagem grande demais (máx. 1,5 MB).");
      return;
    }
    try {
      const dataUrl = await arquivoParaDataUrl(file);
      set("logoDataUrl", dataUrl);
    } catch {
      toast.error("Não foi possível carregar a imagem.");
    }
  };

  const onSalvar = () => {
    setSalvando(true);
    try {
      salvar(form);
      toast.success("Configurações salvas.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ShellPainel
      titulo="Configurações da Igreja"
      descricao="Dados que aparecem no cabeçalho dos PDFs gerados."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome da igreja *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="Ex.: Igreja Presbiteriana de ..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subtitulo">Subtítulo</Label>
                <Input
                  id="subtitulo"
                  value={form.subtitulo}
                  onChange={(e) => set("subtitulo", e.target.value)}
                  placeholder="Ex.: Tesouraria — Sociedades Internas"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={form.endereco}
                  onChange={(e) => set("endereco", e.target.value)}
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cidade">Cidade / UF</Label>
                <Input
                  id="cidade"
                  value={form.cidadeUf}
                  onChange={(e) => set("cidadeUf", e.target.value)}
                  placeholder="Cidade / UF"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                <Input
                  id="cnpj"
                  value={form.cnpj}
                  onChange={(e) => set("cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={onSalvar} disabled={salvando || !form.nome.trim()}>
                Salvar configurações
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex h-40 items-center justify-center rounded-md border bg-muted/30">
              {form.logoDataUrl ? (
                <img
                  src={form.logoDataUrl}
                  alt="Logo da igreja"
                  className="max-h-36 max-w-full object-contain"
                />
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma logo enviada</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
                />
                <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-sm hover:bg-accent">
                  <ImagePlus className="h-4 w-4" /> Enviar logo
                </span>
              </label>
              {form.logoDataUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => set("logoDataUrl", null)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Remover
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PNG/JPG/WEBP, até 1,5 MB. A imagem é armazenada localmente neste navegador.
            </p>
          </CardContent>
        </Card>
      </div>
    </ShellPainel>
  );
}
