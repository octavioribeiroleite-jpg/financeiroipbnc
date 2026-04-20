import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/shared/MonthPicker";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function FiltroPeriodo({ value, onChange }: Props) {
  return (
    <div className="flex items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor="periodo" className="text-xs text-muted-foreground">
          Mês de referência
        </Label>
        <div className="w-44">
          <MonthPicker id="periodo" value={value} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
