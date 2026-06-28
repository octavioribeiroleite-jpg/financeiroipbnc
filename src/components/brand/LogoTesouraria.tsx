import { cn } from "@/lib/utils";

interface LogoTesourariaProps {
  variant?: "horizontal" | "vertical" | "icon";
  theme?: "light" | "dark" | "monochrome";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const TAMANHOS = {
  sm: {
    icon: "h-9 w-9",
    title: "text-sm",
    subtitle: "text-xs",
    gap: "gap-2.5",
  },
  md: {
    icon: "h-12 w-12",
    title: "text-xl",
    subtitle: "text-sm",
    gap: "gap-3.5",
  },
  lg: {
    icon: "h-16 w-16",
    title: "text-3xl",
    subtitle: "text-lg",
    gap: "gap-4",
  },
} as const;

function Simbolo({ theme, className }: { theme: NonNullable<LogoTesourariaProps["theme"]>; className?: string }) {
  const monocromatico = theme === "monochrome";
  const corEstrutura = monocromatico ? "currentColor" : "#D2A93B";
  const corDetalhe = monocromatico ? "currentColor" : theme === "dark" ? "#F8FAFC" : "#16345D";

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Símbolo da Tesouraria Presbiteriana"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 52V24.5L32 9l20 15.5V52"
        stroke={corEstrutura}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 52V37" stroke={corDetalhe} strokeWidth="5" strokeLinecap="round" />
      <path d="M32 52V28" stroke={corDetalhe} strokeWidth="5" strokeLinecap="round" />
      <path d="M42 52V33" stroke={corDetalhe} strokeWidth="5" strokeLinecap="round" />
      <path d="M28 23h8M32 19v8" stroke={corEstrutura} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M8 54h48" stroke={corEstrutura} strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

export function LogoTesouraria({
  variant = "horizontal",
  theme = "dark",
  size = "md",
  className,
}: LogoTesourariaProps) {
  const tamanho = TAMANHOS[size];
  const corTitulo = theme === "dark" ? "text-white" : theme === "light" ? "text-brand-navy-900" : "text-current";
  const corSubtitulo =
    theme === "dark" ? "text-slate-300" : theme === "light" ? "text-slate-500" : "text-current opacity-70";

  if (variant === "icon") {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-gold-400 to-brand-gold-600 p-2 shadow-sm ring-1 ring-white/20",
          tamanho.icon,
          className,
        )}
      >
        <Simbolo theme="light" className="h-full w-full" />
      </div>
    );
  }

  const vertical = variant === "vertical";

  return (
    <div
      className={cn(
        "inline-flex min-w-0 items-center",
        vertical ? "flex-col text-center" : tamanho.gap,
        vertical && "gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-gold-400 to-brand-gold-600 p-2 shadow-sm ring-1 ring-white/20",
          tamanho.icon,
        )}
      >
        <Simbolo theme="light" className="h-full w-full" />
      </div>

      <div className={cn("min-w-0 leading-tight", vertical && "items-center")}>
        <p className={cn("truncate font-bold tracking-[-0.025em]", tamanho.title, corTitulo)}>Tesouraria</p>
        <p className={cn("truncate font-medium", tamanho.subtitle, corSubtitulo)}>Presbiteriana</p>
      </div>
    </div>
  );
}
