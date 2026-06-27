import { ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PIN_CORRETO = "010203";
const CHAVE = "pin_desbloqueado";

export function PinGate({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const [desbloqueado, setDesbloqueado] = useState(() => sessionStorage.getItem(CHAVE) === "1");
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!desbloqueado) inputRef.current?.focus();
  }, [desbloqueado]);

  if (desbloqueado) return <>{children}</>;

  const tentar = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === PIN_CORRETO) {
      sessionStorage.setItem(CHAVE, "1");
      setErro(false);
      setDesbloqueado(true);
      return;
    }
    setErro(true);
    setPin("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <Card className="w-full max-w-sm shadow-[var(--shadow-elegant)]">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl">Digite seu PIN</CardTitle>
          <CardDescription>Acesso rápido à tesouraria.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={tentar} className="space-y-4">
            <Input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              maxLength={10}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setErro(false);
              }}
              className="text-center text-2xl tracking-[0.5em]"
              placeholder="•••••"
            />
            {erro && (
              <p className="text-center text-sm text-destructive">PIN incorreto. Tente de novo.</p>
            )}
            <Button type="submit" className="w-full" disabled={pin.length === 0}>
              Entrar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={async () => {
                sessionStorage.removeItem(CHAVE);
                await signOut();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair da conta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
