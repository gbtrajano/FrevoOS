import { cn } from "@/lib/utils";

/**
 * Glifo da marca: duas lentes interligadas por uma ponte central,
 * o elemento de assinatura visual repetido em pequenas doses
 * (anéis de gráfico, indicadores de carregamento, favicon).
 */
export function LensMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-current", className)}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <circle cx="36" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M22 11.5h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
