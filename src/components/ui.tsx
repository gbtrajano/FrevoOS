"use client";

import { type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* Cartão de superfície branco — base de todas as páginas internas */
export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl2 bg-white shadow-card", className)}>
      {children}
    </div>
  );
}

/* Cabeçalho de página com título, descrição e ação principal */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-ink-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* Input de pesquisa padrão das listagens */
export function SearchInput({
  value,
  onChange,
  placeholder = "Pesquisar...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-sand-300 bg-sand-50 py-2.5 pl-9 pr-9 text-sm text-ink-900 outline-none transition focus:border-garnet-400 focus:ring-2 focus:ring-garnet-100"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/* Badge de status genérico, cor por classe utilitária */
export function Badge({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        className
      )}
      style={style}
    >
      {children}
    </span>
  );
}

/* Estado vazio para tabelas sem resultados */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="mb-1 h-10 w-16 rounded-full border-2 border-dashed border-sand-300" />
      <p className="font-medium text-ink-700">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-ink-500">{description}</p>
      )}
      {action}
    </div>
  );
}

/* Cartão de indicador numérico do dashboard */
export function StatCard({
  label,
  value,
  hint,
  accent = "garnet",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "garnet" | "teal" | "amber" | "navy";
}) {
  const ring =
    accent === "teal"
      ? "border-lab-teal/30 text-lab-teal"
      : accent === "amber"
      ? "border-lab-amber/30 text-amber-500"
      : accent === "navy"
      ? "border-lab-navy/30 text-lab-navy"
      : "border-garnet-200 text-garnet-500";
  return (
    <Surface className="flex items-center gap-4 p-5">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px]",
          ring
        )}
      >
        <span className="h-2 w-2 rounded-full bg-current" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-300">
          {label}
        </p>
        <p className="truncate font-display text-xl font-bold text-ink-900 tabular">
          {value}
        </p>
        {hint && <p className="text-xs text-ink-500">{hint}</p>}
      </div>
    </Surface>
  );
}

/* Botão primário (vermelho) */
export function ButtonPrimary({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-garnet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-pop transition hover:bg-garnet-600 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

/* Botão secundário (contorno) */
export function ButtonSecondary({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-sand-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

/* Botão de ícone para ações em linha de tabela */
export function IconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-ink-500 transition hover:bg-sand-100 hover:text-ink-900",
        className
      )}
    >
      {children}
    </button>
  );
}

/* Modal genérico */
export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-xl2 bg-white shadow-card",
          width
        )}
      >
        <div className="flex items-center justify-between border-b border-sand-200 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-ink-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-300 hover:bg-sand-100 hover:text-ink-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* Diálogo de confirmação (exclusões) */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Excluir",
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/50" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-xl2 bg-white p-6 shadow-card">
        <h3 className="font-display text-lg font-bold text-ink-900">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-ink-500">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <ButtonSecondary onClick={onCancel}>Cancelar</ButtonSecondary>
          <button
            onClick={onConfirm}
            className={cn(
              "rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
              danger
                ? "bg-garnet-500 hover:bg-garnet-600"
                : "bg-lab-teal hover:opacity-90"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Form field wrapper padrão */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-sand-300 bg-sand-50 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition focus:border-garnet-400 focus:ring-2 focus:ring-garnet-100";
