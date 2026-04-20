import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReabrirFechamento } from "@/hooks/fechamentos/useFechamentos";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fechamentoId: string | null;
  onReaberto?: () => void;
}

export function ModalReabrirFechamento({ open, onOpenChange, fechamentoId, onReaberto }: Props) {
  const [motivo, setMotivo] = useState("");
  const reabrir = useReabrirFechamento();
  const motivoValido = motivo.trim().length >= 5;

  const handleConfirmar = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fechamentoId || !motivoValido) return;
    await reabrir.mutateAsync({ id: fechamentoId, motivo: motivo.trim() });
    setMotivo("");
    onOpenChange(false);
    onReaberto?.();
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setMotivo("");
        onOpenChange(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reabrir mês consolidado</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação volta o fechamento para o status <strong>conferido</strong>, permitindo
            novamente lançamentos no mês. O motivo será registrado em auditoria e anexado à
            observação do fechamento.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="motivo-reabertura" className="text-xs">
            Motivo (mín. 5 caracteres) <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="motivo-reabertura"
            rows={4}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: Lançamento de contribuição esquecida da última semana do mês..."
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmar}
            disabled={!motivoValido || reabrir.isPending}
          >
            {reabrir.isPending ? "Reabrindo..." : "Confirmar reabertura"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
