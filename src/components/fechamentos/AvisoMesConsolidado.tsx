import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock } from "lucide-react";

interface Props {
  visivel: boolean;
  mensagem?: string;
}

export function AvisoMesConsolidado({ visivel, mensagem }: Props) {
  if (!visivel) return null;
  return (
    <Alert variant="destructive">
      <Lock className="h-4 w-4" />
      <AlertTitle>Mês consolidado</AlertTitle>
      <AlertDescription>
        {mensagem ??
          "O mês de referência já foi consolidado pela tesouraria da igreja e não aceita novas alterações."}
      </AlertDescription>
    </Alert>
  );
}
