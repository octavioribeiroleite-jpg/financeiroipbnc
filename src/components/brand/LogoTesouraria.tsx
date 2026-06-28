import { cn } from "@/lib/utils";

type Variant = "horizontal" | "vertical" | "icon";
type Theme = "light" | "dark" | "monochrome";
type Size = "sm" | "md" | "lg";

interface Props {
  variant?: Variant;
  theme?: Theme;
  size?: Size;
  className?: string;
  withTagline?: boolean;
}

const SIZE_MAP: Record<Size, { icon: number; title: string; subtitle: string }> = {
  sm: { icon: 28, title: "text-sm", subtitle: "text-[10px]" },
  md: { icon: 36, title: "text-base", subtitle: "text-xs" },
  lg: { icon: 56, title: "text-2xl", subtitle: "text-sm" },
};

function paletaTema(theme: Theme) {
  if (theme === "dark") return { contorno: "#ffffff", base: "#ffffff", barras: "#e1bd5a", cruz: "#e1bd5a" };
  if (theme === "monochrome") return { contorno: "currentColor", base: "currentColor", barras: "currentColor", cruz: "currentColor" };
  return { contorno: "#16345d", base: "#102744", barras: "#c89624", cruz: "#d2a93b" };
}

/** Símbolo vetorial: contorno de igreja + 3 barras verticais (gráfico) + cruz central. */
function Simbolo({ size, theme }: { size: number; theme: Theme }) {
  const p = paletaTema(theme);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      {/* base / piso */}
      <rect x="6" y="50" width="52" height="6" rx="1.5" fill={p.base} />
      {/* contorno da igreja: telhado triangular */}
      <path
        d="M32 6 L56 26 L56 50 L8 50 L8 26 Z"
        stroke={p.contorno}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />
      {/* cruz no topo */}
      <path d="M32 2 V12 M28 6 H36" stroke={p.cruz} strokeWidth="2.2" strokeLinecap="round" />
      {/* 3 barras verticais que lembram gráfico financeiro / porta central */}
      <rect x="18" y="38" width="6" height="12" rx="1.2" fill={p.barras} />
      <rect x="29" y="30" width="6" height="20" rx="1.2" fill={p.barras} />
      <rect x="40" y="34" width="6" height="16" rx="1.2" fill={p.barras} />
    </svg>
  );
}

export function LogoTesouraria({
  variant = "horizontal",
  theme = "light",
  size = "md",
  className,
  withTagline = true,
}: Props) {
  const dims = SIZE_MAP[size];
  const corTexto =
    theme === "dark" ? "text-white" : theme === "monochrome" ? "" : "text-[#102744]";
  const corSub =
    theme === "dark" ? "text-white/70" : theme === "monochrome" ? "opacity-70" : "text-[#64748b]";

  if (variant === "icon") {
    return (
      <span className={cn("inline-flex", className)} aria-label="Tesouraria Presbiteriana">
        <Simbolo size={dims.icon} theme={theme} />
      </span>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={cn("inline-flex flex-col items-center gap-2", className)}>
        <Simbolo size={dims.icon} theme={theme} />
        <div className="text-center leading-tight">
          <p className={cn("font-semibold tracking-tight", dims.title, corTexto)}>Tesouraria</p>
          {withTagline && (
            <p className={cn("font-medium tracking-wide", dims.subtitle, corSub)}>PRESBITERIANA</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <Simbolo size={dims.icon} theme={theme} />
      <div className="leading-tight">
        <p className={cn("font-semibold tracking-tight", dims.title, corTexto)}>Tesouraria</p>
        {withTagline && (
          <p className={cn("font-medium uppercase tracking-[0.16em]", dims.subtitle, corSub)}>
            Presbiteriana
          </p>
        )}
      </div>
    </div>
  );
}

export default LogoTesouraria;
