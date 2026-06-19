"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast-context";
import { PageHeader, StatCard, Surface } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  STATUS_OS_COLORS,
  STATUS_OS_LABELS,
  type ContaPagar,
  type ContaReceber,
  type OrdemServico,
  type StatusOS,
} from "@/lib/types";

const STATUS_ORDER: StatusOS[] = [
  "solicitado",
  "laboratorio",
  "pronto",
  "concluido",
  "cancelado",
];

export default function RelatorioPage() {
  const supabase = getSupabaseBrowserClient();
  const { notify } = useToast();

  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [pagar, setPagar] = useState<ContaPagar[]>([]);
  const [receber, setReceber] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [osRes, pagarRes, receberRes] = await Promise.all([
        supabase.from("ordens_servico").select("status, valor_total"),
        supabase.from("contas_pagar").select("valor, pago"),
        supabase.from("contas_receber").select("valor, recebido"),
      ]);
      if (osRes.error || pagarRes.error || receberRes.error)
        notify("Erro ao carregar relatório.", "error");
      setOrdens((osRes.data as unknown as OrdemServico[]) ?? []);
      setPagar((pagarRes.data as ContaPagar[]) ?? []);
      setReceber((receberRes.data as ContaReceber[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const osTotals = useMemo(() => {
    const map: Record<StatusOS, number> = {
      solicitado: 0,
      laboratorio: 0,
      pronto: 0,
      concluido: 0,
      cancelado: 0,
    };
    for (const o of ordens) map[o.status] += Number(o.valor_total) || 0;
    return map;
  }, [ordens]);

  const finStats = useMemo(() => {
    const totalPagar = pagar.reduce((s, c) => s + Number(c.valor), 0);
    const pago = pagar
      .filter((c) => c.pago)
      .reduce((s, c) => s + Number(c.valor), 0);
    const totalReceber = receber.reduce((s, c) => s + Number(c.valor), 0);
    const recebido = receber
      .filter((c) => c.recebido)
      .reduce((s, c) => s + Number(c.valor), 0);
    return { totalPagar, pago, totalReceber, recebido };
  }, [pagar, receber]);

  const resultado = finStats.recebido - finStats.pago;

  const chartData = useMemo(
    () =>
      STATUS_ORDER.map((s) => ({
        name: STATUS_OS_LABELS[s],
        valor: osTotals[s],
        color: STATUS_OS_COLORS[s],
      })),
    [osTotals]
  );

  const comparisonData = [
    { name: "Receita\nrecebida", valor: finStats.recebido, color: "#2F9E6E" },
    { name: "Despesa\npaga", valor: finStats.pago, color: "#B3122B" },
    { name: "Resultado", valor: Math.max(resultado, 0), color: resultado >= 0 ? "#2451B3" : "#B3122B" },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Relatório de Vendas" />
        <p className="text-sm text-ink-400">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Relatório de Vendas"
        description="Visão geral das finanças e operações da ótica."
      />

      {/* Resultado financeiro */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-base font-bold text-ink-700">
          Resultado Financeiro
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total a receber"
            value={formatCurrency(finStats.totalReceber)}
            hint="lançado"
            accent="teal"
          />
          <StatCard
            label="Já recebido"
            value={formatCurrency(finStats.recebido)}
            accent="teal"
          />
          <StatCard
            label="Total a pagar"
            value={formatCurrency(finStats.totalPagar)}
            hint="lançado"
            accent="garnet"
          />
          <StatCard
            label="Já pago"
            value={formatCurrency(finStats.pago)}
            accent="garnet"
          />
        </div>
        <Surface className="mt-4 p-5">
          <div className="mb-2 flex items-baseline gap-3">
            <span className="font-display text-sm font-semibold text-ink-500">
              Resultado líquido (recebido − pago):
            </span>
            <span
              className={`font-display text-2xl font-bold tabular ${
                resultado >= 0 ? "text-lab-teal" : "text-garnet-500"
              }`}
            >
              {formatCurrency(resultado)}
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECE1DD" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9C8A91" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9C8A91" }}
                  tickFormatter={(v) =>
                    v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                  }
                />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {comparisonData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Surface>
      </section>

      {/* OS por status */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-base font-bold text-ink-700">
          Ordens de Serviço por Status
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {STATUS_ORDER.map((s) => (
            <Surface key={s} className="p-4 text-center">
              <p
                className="mb-1 text-xs font-semibold uppercase tracking-wide"
                style={{ color: STATUS_OS_COLORS[s] }}
              >
                {STATUS_OS_LABELS[s]}
              </p>
              <p className="font-display text-lg font-bold text-ink-900 tabular">
                {ordens.filter((o) => o.status === s).length}
              </p>
              <p className="mt-0.5 text-xs text-ink-400 tabular">
                {formatCurrency(osTotals[s])}
              </p>
            </Surface>
          ))}
        </div>
        <Surface className="mt-4 p-5">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECE1DD" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9C8A91" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9C8A91" }}
                  tickFormatter={(v) =>
                    v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                  }
                />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Surface>
      </section>

      {/* Totais gerais */}
      <section>
        <h2 className="mb-3 font-display text-base font-bold text-ink-700">
          Total Geral das OS
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Total lançado (OS)"
            value={formatCurrency(
              ordens.reduce((s, o) => s + Number(o.valor_total), 0)
            )}
            accent="navy"
          />
          <StatCard
            label="OS concluídas"
            value={formatCurrency(osTotals.concluido)}
            hint={`${ordens.filter((o) => o.status === "concluido").length} OS(s)`}
            accent="teal"
          />
        </div>
      </section>
    </div>
  );
}
