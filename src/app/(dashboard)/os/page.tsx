"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast-context";
import {
  Badge,
  ButtonPrimary,
  ConfirmDialog,
  EmptyState,
  IconButton,
  PageHeader,
  SearchInput,
  Surface,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  STATUS_OS_COLORS,
  STATUS_OS_LABELS,
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

function OsListInner() {
  const supabase = getSupabaseBrowserClient();
  const { notify } = useToast();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");

  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>(
    initialStatus && STATUS_ORDER.includes(initialStatus as StatusOS)
      ? initialStatus
      : "todos"
  );
  const [deleteTarget, setDeleteTarget] = useState<OrdemServico | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ordens_servico")
      .select("*, clientes(nome)")
      .order("id", { ascending: false });
    if (error) notify("Erro ao carregar ordens de serviço.", "error");
    setOrdens((data as unknown as OrdemServico[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totaisPorStatus = useMemo(() => {
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

  const totalGeral = useMemo(
    () => Object.values(totaisPorStatus).reduce((a, b) => a + b, 0),
    [totaisPorStatus]
  );

  const chartData = useMemo(
    () =>
      STATUS_ORDER.filter((s) => totaisPorStatus[s] > 0).map((s) => ({
        status: s,
        label: STATUS_OS_LABELS[s],
        valor: totaisPorStatus[s],
        color: STATUS_OS_COLORS[s],
      })),
    [totaisPorStatus]
  );

  const filtered = useMemo(() => {
    let list = ordens;
    if (statusFiltro !== "todos") {
      list = list.filter((o) => o.status === statusFiltro);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.clientes?.nome.toLowerCase().includes(q) ||
          String(o.id).includes(q)
      );
    }
    return list;
  }, [ordens, statusFiltro, query]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("ordens_servico")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      notify("Não foi possível excluir a OS.", "error");
    } else {
      notify("Ordem de serviço removida.");
      load();
    }
    setDeleteTarget(null);
  }

  function badgeStyle(status: StatusOS) {
    const color = STATUS_OS_COLORS[status];
    return { backgroundColor: `${color}1A`, color };
  }

  return (
    <div>
      <PageHeader
        title="Ordens de Serviço"
        description="Acompanhe a produção, do pedido até a entrega."
        action={
          <Link href="/os/novo">
            <ButtonPrimary>
              <Plus size={16} /> Nova OS
            </ButtonPrimary>
          </Link>
        }
      />

      <Surface className="mb-6 p-5">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-6">
            <div className="h-40 w-40 shrink-0">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="valor"
                      nameKey="label"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-ink-300">
                  Sem dados
                </div>
              )}
            </div>
            <ul className="space-y-1.5 text-sm">
              {STATUS_ORDER.map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_OS_COLORS[s] }}
                  />
                  <span className="text-ink-600">{STATUS_OS_LABELS[s]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-ink-900">
              Total geral das OS: <span className="tabular">{formatCurrency(totalGeral)}</span>
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
              {STATUS_ORDER.map((s) => (
                <li key={s} className="text-ink-600">
                  <span className="font-semibold text-ink-900">
                    {STATUS_OS_LABELS[s]}:
                  </span>{" "}
                  <span className="tabular">
                    {formatCurrency(totaisPorStatus[s])}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Surface>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Pesquisar por cliente ou número..."
        />
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="rounded-lg border border-sand-300 bg-sand-50 px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-garnet-400 focus:ring-2 focus:ring-garnet-100"
        >
          <option value="todos">Todos os status</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_OS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50 text-left text-xs font-semibold uppercase tracking-wide text-garnet-600">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-300">
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="Nenhuma OS encontrada"
                      description="Crie uma nova ordem de serviço para um cliente."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-sand-100 last:border-0 hover:bg-sand-50/60"
                  >
                    <td className="px-5 py-3.5 text-ink-500 tabular">{o.id}</td>
                    <td className="px-5 py-3.5 font-medium text-ink-900">
                      {o.clientes?.nome ?? "Cliente removido"}
                    </td>
                    <td className="px-5 py-3.5 text-ink-700 tabular">
                      {formatDate(o.data)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge style={badgeStyle(o.status)}>
                        {STATUS_OS_LABELS[o.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-ink-900 tabular">
                      {formatCurrency(o.valor_total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <Link href={`/os/${o.id}`}>
                          <IconButton title="Ver / editar">
                            <Eye size={15} />
                          </IconButton>
                        </Link>
                        <Link href={`/os/${o.id}`}>
                          <IconButton title="Editar">
                            <Pencil size={15} />
                          </IconButton>
                        </Link>
                        <IconButton
                          title="Excluir"
                          onClick={() => setDeleteTarget(o)}
                        >
                          <Trash2 size={15} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="border-t border-sand-200 px-5 py-3 text-xs text-ink-500">
            Mostrando {filtered.length} de {ordens.length} registro(s).
          </div>
        )}
      </Surface>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir ordem de serviço"
        description={`Tem certeza que deseja excluir a OS #${deleteTarget?.id}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function OsListPage() {
  return (
    <Suspense fallback={null}>
      <OsListInner />
    </Suspense>
  );
}
