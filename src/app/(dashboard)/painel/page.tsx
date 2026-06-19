"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  FileText,
  Search,
  ClipboardCheck,
  BarChart3,
  Hourglass,
  ArrowUpRight,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PageHeader, StatCard, Surface } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  STATUS_OS_COLORS,
  STATUS_OS_LABELS,
  type Orcamento,
  type OrdemServico,
} from "@/lib/types";

const QUICK_ACTIONS = [
  {
    href: "/os/novo",
    label: "Nova Venda / OS",
    icon: PlusCircle,
    desc: "Abrir uma nova ordem de serviço",
  },
  {
    href: "/orcamentos/novo",
    label: "Orçamento",
    icon: FileText,
    desc: "Montar um novo orçamento",
  },
  {
    href: "/os",
    label: "Alterar ou Consultar OS",
    icon: Search,
    desc: "Buscar uma ordem de serviço existente",
  },
  {
    href: "/os?status=concluido",
    label: "Vendas Finalizadas",
    icon: ClipboardCheck,
    desc: "OS já concluídas",
  },
  {
    href: "/financeiro/relatorio",
    label: "Relatório de Vendas",
    icon: BarChart3,
    desc: "Visão geral do período",
  },
  {
    href: "/os?status=solicitado",
    label: "Vendas Pendentes",
    icon: Hourglass,
    desc: "OS aguardando andamento",
  },
];

export default function PainelPage() {
  const [loading, setLoading] = useState(true);
  const [clientesAtivos, setClientesAtivos] = useState(0);
  const [estoqueBaixo, setEstoqueBaixo] = useState(0);
  const [orcamentosPendentes, setOrcamentosPendentes] = useState({
    count: 0,
    total: 0,
  });
  const [contasAVencer, setContasAVencer] = useState(0);
  const [recentOs, setRecentOs] = useState<OrdemServico[]>([]);
  const [recentOrcamentos, setRecentOrcamentos] = useState<Orcamento[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();

      const [
        clientesRes,
        produtosRes,
        orcamentosRes,
        contasRes,
        osRes,
        orcRes,
      ] = await Promise.all([
        supabase
          .from("clientes")
          .select("id", { count: "exact", head: true })
          .eq("status", "ativo"),
        supabase.from("produtos").select("estoque, estoque_minimo"),
        supabase
          .from("orcamentos")
          .select("valor_total", { count: "exact" })
          .eq("aprovado", false),
        supabase.from("contas_pagar").select("valor").eq("pago", false),
        supabase
          .from("ordens_servico")
          .select("*, clientes(nome)")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("orcamentos")
          .select("*, clientes(nome)")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      setClientesAtivos(clientesRes.count ?? 0);

      const baixo = (produtosRes.data ?? []).filter(
        (p) => p.estoque <= p.estoque_minimo
      ).length;
      setEstoqueBaixo(baixo);

      const totalOrc = (orcamentosRes.data ?? []).reduce(
        (acc, o) => acc + (o.valor_total ?? 0),
        0
      );
      setOrcamentosPendentes({
        count: orcamentosRes.count ?? 0,
        total: totalOrc,
      });

      const totalContas = (contasRes.data ?? []).reduce(
        (acc, c) => acc + (c.valor ?? 0),
        0
      );
      setContasAVencer(totalContas);

      setRecentOs((osRes.data as unknown as OrdemServico[]) ?? []);
      setRecentOrcamentos(
        (orcRes.data as unknown as Orcamento[]) ?? []
      );
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Painel"
        description="Visão geral da sua ótica hoje."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Clientes ativos"
          value={loading ? "—" : String(clientesAtivos)}
          accent="navy"
        />
        <StatCard
          label="Produtos com estoque baixo"
          value={loading ? "—" : String(estoqueBaixo)}
          hint="Repor em breve"
          accent="amber"
        />
        <StatCard
          label="Orçamentos pendentes"
          value={loading ? "—" : String(orcamentosPendentes.count)}
          hint={!loading ? formatCurrency(orcamentosPendentes.total) : undefined}
          accent="garnet"
        />
        <StatCard
          label="Contas a vencer"
          value={loading ? "—" : formatCurrency(contasAVencer)}
          accent="teal"
        />
      </div>

      <h2 className="mb-4 mt-10 font-display text-lg font-bold text-ink-900">
        Menu de vendas
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-4 rounded-xl2 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-garnet-50 text-garnet-500 transition group-hover:bg-garnet-500 group-hover:text-white">
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink-900">
                  {action.label}
                </span>
                <span className="block truncate text-xs text-ink-500">
                  {action.desc}
                </span>
              </span>
              <ArrowUpRight
                size={16}
                className="ml-auto shrink-0 text-ink-300 transition group-hover:text-garnet-500"
              />
            </Link>
          );
        })}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Surface className="p-5">
          <h3 className="mb-4 font-display text-base font-bold text-ink-900">
            Últimas ordens de serviço
          </h3>
          {recentOs.length === 0 ? (
            <p className="text-sm text-ink-500">Nenhuma OS registrada ainda.</p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {recentOs.map((os) => (
                <li
                  key={os.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">
                      #{os.id} · {os.clientes?.nome ?? "Cliente removido"}
                    </p>
                    <p className="text-xs text-ink-500">{formatDate(os.data)}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: STATUS_OS_COLORS[os.status] }}
                  >
                    {STATUS_OS_LABELS[os.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface className="p-5">
          <h3 className="mb-4 font-display text-base font-bold text-ink-900">
            Últimos orçamentos
          </h3>
          {recentOrcamentos.length === 0 ? (
            <p className="text-sm text-ink-500">
              Nenhum orçamento registrado ainda.
            </p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {recentOrcamentos.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">
                      #{o.id} · {o.clientes?.nome ?? "Cliente removido"}
                    </p>
                    <p className="text-xs text-ink-500">{formatDate(o.data)}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-ink-900 tabular">
                    {formatCurrency(o.valor_total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </div>
  );
}
