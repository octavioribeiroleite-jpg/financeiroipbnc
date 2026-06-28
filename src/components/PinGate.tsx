import { ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoTesouraria } from "@/components/brand/LogoTesouraria";
import { BotaoAtualizar } from "@/components/BotaoAtualizar";

const PIN_CORRETO = "010203";
const CHAVE = "pin_desbloqueado";

export function PinGate({ children }: { children: ReactNode }) {
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="fixed right-3 top-[max(12px,env(safe-area-inset-top))] z-50">
        <BotaoAtualizar className="border border-border/70 bg-card/95 shadow-card backdrop-blur" />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <LogoTesouraria variant="vertical" theme="light" size="md" />
        </div>
        <Card className="border-border/70 shadow-card">
          <CardHeader className="items-center text-center">
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
                className="tabular text-center text-2xl tracking-[0.5em]"
                placeholder="•••••"
                aria-label="PIN de acesso"
              />
              {erro && (
                <p className="text-center text-sm text-destructive">PIN incorreto. Tente de novo.</p>
              )}
              <Button type="submit" className="w-full" disabled={pin.length === 0}>
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
