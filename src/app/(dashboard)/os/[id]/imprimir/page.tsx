"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  STATUS_OS_LABELS,
  STATUS_PRODUCAO_LABELS,
  STATUS_PRODUCAO_COLORS,
  STATUS_PAGAMENTO_LABELS,
  STATUS_PAGAMENTO_COLORS,
  type StatusOS,
  type StatusProducao,
  type StatusPagamento,
} from "@/lib/types";

const LOGO_KEY = "otica_logo_b64";
const DEFAULT_LOGO = "/logo.png";

interface OsItem {
  id: number;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

interface OsData {
  id: number;
  data: string;
  status: StatusOS;
  status_producao: StatusProducao;
  status_pagamento: StatusPagamento;
  observacoes: string | null;
  desconto: number;
  valor_total: number;
  clientes: { nome: string; cpf: string | null; telefone: string | null; email: string | null } | null;
}

export default function ImprimirOsPage({
  params,
}: {
  params: { id: string };
}) {
  const osId = Number(params.id);
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const [os, setOs] = useState<OsData | null>(null);
  const [itens, setItens] = useState<OsItem[]>([]);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(LOGO_KEY);
    setLogoSrc(stored ?? DEFAULT_LOGO);
  }, []);

  useEffect(() => {
    async function load() {
      const [osRes, itensRes] = await Promise.all([
        supabase
          .from("ordens_servico")
          .select("*, clientes(nome, cpf, telefone, email)")
          .eq("id", osId)
          .single(),
        supabase.from("os_itens").select("*").eq("os_id", osId),
      ]);
      setOs(osRes.data as unknown as OsData);
      setItens((itensRes.data as OsItem[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osId]);

  const subtotal = itens.reduce(
    (acc, it) => acc + it.quantidade * it.valor_unitario,
    0
  );
  const desconto = os?.desconto ?? 0;
  const total = Math.max(0, subtotal - desconto);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-300">
        Carregando...
      </div>
    );
  }

  if (!os) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-400">
        OS não encontrada.
      </div>
    );
  }

  return (
    <>
      {/* Toolbar — oculta na impressão */}
      <div className="no-print sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-sand-200 bg-white px-6 py-3 shadow-sm">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-garnet-500"
        >
          <ArrowLeft size={15} /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <p className="text-sm text-ink-500">
            Use <kbd className="rounded bg-sand-100 px-1.5 py-0.5 text-xs font-mono">Ctrl+P</kbd> ou o botão abaixo para imprimir / salvar em PDF
          </p>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-garnet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-garnet-600"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Folha A4 — esta parte é impressa */}
      <div
        id="os-print-area"
        className="mx-auto my-8 max-w-[794px] rounded-xl bg-white p-10 shadow-card print:my-0 print:max-w-none print:rounded-none print:shadow-none"
      >
        {/* Cabeçalho */}
        <div className="mb-8 flex items-start justify-between gap-6 border-b border-gray-200 pb-6">
          <div className="flex-1">
            <img
              src={logoSrc ?? DEFAULT_LOGO}
              alt="Logo da ótica"
              className="mb-2 h-16 max-w-[200px] object-contain"
            />
            <p className="text-xs text-gray-400">CNPJ: 62.420.793/0001-55</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-400">Ordem de Serviço</p>
            <p className="font-display text-4xl font-bold text-garnet-600">#{os.id.toString().padStart(4, "0")}</p>
            <p className="mt-1 text-sm text-gray-500">Data: <strong>{formatDate(os.data)}</strong></p>
            <div className="mt-2 flex flex-col items-end gap-1.5">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${STATUS_PRODUCAO_COLORS[os.status_producao ?? "em_producao"]}20`,
                  color: STATUS_PRODUCAO_COLORS[os.status_producao ?? "em_producao"],
                }}
              >
                Produção: {STATUS_PRODUCAO_LABELS[os.status_producao ?? "em_producao"]}
              </span>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${STATUS_PAGAMENTO_COLORS[os.status_pagamento ?? "pendente"]}20`,
                  color: STATUS_PAGAMENTO_COLORS[os.status_pagamento ?? "pendente"],
                }}
              >
                Pagamento: {STATUS_PAGAMENTO_LABELS[os.status_pagamento ?? "pendente"]}
              </span>
            </div>
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-garnet-600">
            Cliente
          </h2>
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-5 py-4">
            <p className="text-lg font-bold text-gray-900">
              {os.clientes?.nome ?? "—"}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-0.5 text-sm text-gray-500">
              {os.clientes?.cpf && <span>CPF: {os.clientes.cpf}</span>}
              {os.clientes?.telefone && <span>Tel: {os.clientes.telefone}</span>}
              {os.clientes?.email && <span>{os.clientes.email}</span>}
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-garnet-600">
            Itens
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-garnet-100 text-left text-xs font-semibold uppercase tracking-wide text-garnet-500">
                <th className="pb-2 pr-4">Descrição</th>
                <th className="pb-2 pr-4 text-center">Qtd.</th>
                <th className="pb-2 pr-4 text-right">Valor unit.</th>
                <th className="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, i) => (
                <tr
                  key={item.id ?? i}
                  className="border-b border-gray-100"
                >
                  <td className="py-3 pr-4 text-gray-800">{item.descricao || "—"}</td>
                  <td className="py-3 pr-4 text-center tabular text-gray-700">{item.quantidade}</td>
                  <td className="py-3 pr-4 text-right tabular text-gray-700">
                    {formatCurrency(item.valor_unitario)}
                  </td>
                  <td className="py-3 text-right tabular font-medium text-gray-900">
                    {formatCurrency(item.quantidade * item.valor_unitario)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div className="mb-8 flex justify-end">
          <div className="w-64 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="tabular">{formatCurrency(subtotal)}</span>
            </div>
            {desconto > 0 && (
              <div className="flex justify-between text-sm text-green-700">
                <span>Desconto</span>
                <span className="tabular">− {formatCurrency(desconto)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
              <span>Total</span>
              <span className="tabular text-garnet-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Observações */}
        {os.observacoes && (
          <div className="mb-8">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-garnet-600">
              Observações
            </h2>
            <p className="rounded-lg border border-gray-100 bg-gray-50 px-5 py-3 text-sm text-gray-700">
              {os.observacoes}
            </p>
          </div>
        )}

        {/* Assinaturas */}
        <div className="mt-12 grid grid-cols-2 gap-12">
          <div>
            <div className="border-b border-gray-300" />
            <p className="mt-2 text-center text-xs text-gray-400">Assinatura do Cliente</p>
          </div>
          <div>
            <div className="border-b border-gray-300" />
            <p className="mt-2 text-center text-xs text-gray-400">Responsável / Ótica</p>
          </div>
        </div>

        {/* Rodapé */}
        <p className="mt-10 text-center text-[10px] text-gray-300">
          Documento gerado em {new Date().toLocaleDateString("pt-BR")} — OS #{os.id.toString().padStart(4, "0")}
        </p>
      </div>

      {/* Print-only global styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          #os-print-area {
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
