import type { ComponentProps } from "react";
import { useTheme } from "next-themes";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = ComponentProps<typeof Sonner>;

const iconeBase =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group [--border-radius:16px] [--width:390px]"
      position="bottom-right"
      closeButton
      richColors
      expand={false}
      visibleToasts={3}
      offset={20}
      gap={12}
      icons={{
        success: (
          <span className={`${iconeBase} bg-emerald-500`}>
            <Check className="h-5 w-5 stroke-[2.5]" />
          </span>
        ),
        error: (
          <span className={`${iconeBase} bg-red-500`}>
            <X className="h-5 w-5 stroke-[2.5]" />
          </span>
        ),
        warning: (
          <span className={`${iconeBase} bg-amber-500`}>
            <AlertTriangle className="h-5 w-5 stroke-[2.25]" />
          </span>
        ),
        info: (
          <span className={`${iconeBase} bg-sky-500`}>
            <Info className="h-5 w-5 stroke-[2.25]" />
          </span>
        ),
      }}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast !w-[390px] !max-w-[calc(100vw-32px)] !items-start !gap-3 rounded-2xl border bg-background/95 px-4 py-4 text-foreground shadow-[0_18px_45px_-24px_rgba(15,23,42,0.55)] backdrop-blur-md",
          content: "min-w-0 flex-1 pr-7",
          icon: "mt-0.5 !h-9 !w-9",
          title: "text-sm font-semibold leading-5 text-foreground",
          description: "mt-1 text-sm leading-5 text-muted-foreground",
          actionButton:
            "!ml-auto !h-8 !rounded-lg !bg-transparent !px-2.5 !text-sm !font-semibold !text-emerald-600 hover:!bg-emerald-50 dark:hover:!bg-emerald-950/40",
          cancelButton:
            "!h-8 !rounded-lg !bg-transparent !px-2.5 !text-sm !font-medium !text-muted-foreground hover:!bg-muted",
          closeButton:
            "!absolute !left-auto !right-2 !top-2 !h-7 !w-7 !translate-x-0 !translate-y-0 !rounded-full !border-0 !bg-transparent !text-muted-foreground shadow-none hover:!bg-muted hover:!text-foreground",
          success: "!border-l-4 !border-l-emerald-500",
          error: "!border-l-4 !border-l-red-500",
          warning: "!border-l-4 !border-l-amber-500",
          info: "!border-l-4 !border-l-sky-500",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
