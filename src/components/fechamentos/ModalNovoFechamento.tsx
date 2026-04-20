import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCriarFechamento } from "@/hooks/fechamentos/useFechamentos";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sociedadeId: string;
}

export function ModalNovoFechamento({ open, onOpenChange, sociedadeId }: Props) {
  const hoje = new Date();
  const ymInicial = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const [ym, setYm] = useState(ymInicial);
  const [obs, setObs] = useState("");
  const criar = useCriarFechamento();

  const handleSubmit = async () => {
    if (!ym) return;
    const [anoStr, mesStr] = ym.split("-");
    await criar.mutateAsync({
      sociedadeId,
      ano: Number(anoStr),
      mes: Number(mesStr),
      observacao: obs.trim() || null,
    });
    onOpenChange(false);
    setObs("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo fechamento</DialogTitle>
          <DialogDescription>
            Os totais serão calculados automaticamente a partir das movimentações confirmadas do mês.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="mes">Mês de referência</Label>
            <Input id="mes" type="month" value={ym} onChange={(e) => setYm(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="obs">Observação (opcional)</Label>
            <Textarea id="obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!ym || criar.isPending}>
            {criar.isPending ? "Criando..." : "Criar fechamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
