import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RegistroAuditoria } from "@/hooks/igreja/useAuditoria";

interface Props {
  registro: RegistroAuditoria | null;
  onClose: () => void;
}

export function ModalDetalhesAuditoria({ registro, onClose }: Props) {
  return (
    <Dialog open={!!registro} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes da auditoria</DialogTitle>
        </DialogHeader>
        {registro && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Módulo:</span>{" "}
                <span className="font-medium">{registro.modulo}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ação:</span>{" "}
                <span className="font-medium">{registro.acao}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Registro ID:</span>{" "}
                <span className="font-mono text-xs">{registro.registro_id ?? "—"}</span>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Detalhes</p>
              <ScrollArea className="h-[400px] rounded border bg-muted/30 p-3">
                <pre className="whitespace-pre-wrap break-words text-xs">
                  {JSON.stringify(registro.detalhes, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
