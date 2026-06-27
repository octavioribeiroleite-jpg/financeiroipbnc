import { forwardRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  id?: string;
  value: number;
  onChange: (valor: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function formatarParaDigitacao(n: number): string {
  if (!n) return "";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function converterDigitacaoEmValor(texto: string): number {
  const somenteDigitos = texto.replace(/\D/g, "");
  if (!somenteDigitos) return 0;
  return Number(somenteDigitos) / 100;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ id, value, onChange, placeholder = "0,00", disabled, className }, ref) => {
    const [texto, setTexto] = useState(formatarParaDigitacao(value));

    useEffect(() => {
      setTexto(formatarParaDigitacao(value));
    }, [value]);

    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          R$
        </span>
        <Input
          ref={ref}
          id={id}
          inputMode="decimal"
          placeholder={placeholder}
          disabled={disabled}
          className={`pl-9 ${className ?? ""}`}
          value={texto}
          onChange={(e) => {
            const valor = converterDigitacaoEmValor(e.target.value);
            setTexto(formatarParaDigitacao(valor));
            onChange(valor);
          }}
          onBlur={() => setTexto(formatarParaDigitacao(value))}
        />
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";
