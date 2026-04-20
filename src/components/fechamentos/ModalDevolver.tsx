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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useDevolverFechamento, type Fechamento } from "@/hooks/fechamentos/useFechamentos";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fechamento: Fechamento | null;
}

export function ModalDevolver({ open, onOpenChange, fechamento }: Props) {
  const [motivo, setMotivo] = useState("");
  const devolver = useDevolverFechamento();

  const handleSubmit = async () => {
    if (!fechamento || !motivo.trim()) return;
    await devolver.mutateAsync({ f: fechamento, motivo: motivo.trim() });
    onOpenChange(false);
    setMotivo("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Devolver fechamento</DialogTitle>
          <DialogDescription>
            O fechamento voltará para o status "Aberto" na sociedade. Informe o motivo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="motivo">Motivo</Label>
          <Textarea
            id="motivo"
            rows={4}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: divergência no total de saídas..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!motivo.trim() || devolver.isPending}
          >
            {devolver.isPending ? "Devolvendo..." : "Devolver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
