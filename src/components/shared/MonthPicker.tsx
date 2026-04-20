import { Input } from "@/components/ui/input";

interface MonthPickerProps {
  id?: string;
  /** Valor no formato "YYYY-MM-DD" (sempre dia 01). */
  value: string;
  onChange: (valorIso: string) => void;
  disabled?: boolean;
}

export function MonthPicker({ id, value, onChange, disabled }: MonthPickerProps) {
  // <input type="month"> trabalha com "YYYY-MM"
  const ym = value && value.length >= 7 ? value.slice(0, 7) : "";
  return (
    <Input
      id={id}
      type="month"
      value={ym}
      disabled={disabled}
      onChange={(e) => {
        const v = e.target.value; // "YYYY-MM"
        onChange(v ? `${v}-01` : "");
      }}
    />
  );
}
