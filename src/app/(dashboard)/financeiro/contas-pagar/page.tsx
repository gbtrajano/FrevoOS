"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast-context";
import {
  Badge,
  ButtonPrimary,
  ButtonSecondary,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Modal,
  PageHeader,
  SearchInput,
  StatCard,
  Surface,
  inputClass,
} from "@/components/ui";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import type { ContaPagar } from "@/lib/types";

const EMPTY_FORM = {
  id: undefined as number | undefined,
  descricao: "",
  categoria: "",
  fornecedor: "",
  valor: "",
  vencimento: todayISO(),
  pago: false,
  data_pagamento: "",
};

export default function ContasPagarPage() {
  const supabase = getSupabaseBrowserClient();
  const { notify } = useToast();

  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "pendente" | "pago">("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContaPagar | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("contas_pagar")
      .select("*")
      .order("vencimento", { ascending: true });
    if (error) notify("Erro ao carregar contas a pagar.", "error");
    setContas((data as ContaPagar[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const pendentes = contas.filter((c) => !c.pago);
    const pagas = contas.filter((c) => c.pago);
    const hoje = todayISO();
    const vencidas = pendentes.filter((c) => c.vencimento && c.vencimento < hoje);
    return {
      totalPendente: pendentes.reduce((s, c) => s + Number(c.valor), 0),
      totalPago: pagas.reduce((s, c) => s + Number(c.valor), 0),
      qtdVencidas: vencidas.length,
    };
  }, [contas]);

  const filtered = useMemo(() => {
    let list = contas;
    if (filtro === "pendente") list = list.filter((c) => !c.pago);
    if (filtro === "pago") list = list.filter((c) => c.pago);
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (c) =>
          c.descricao.toLowerCase().includes(q) ||
          (c.fornecedor ?? "").toLowerCase().includes(q) ||
          (c.categoria ?? "").toLowerCase().includes(q)
      );
    return list;
  }, [contas, filtro, query]);

  function openNew() {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(c: ContaPagar) {
    setForm({
      id: c.id,
      descricao: c.descricao,
      categoria: c.categoria ?? "",
      fornecedor: c.fornecedor ?? "",
      valor: String(c.valor),
      vencimento: c.vencimento ?? "",
      pago: c.pago,
      data_pagamento: c.data_pagamento ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.descricao.trim()) {
      notify("Informe a descrição.", "error");
      return;
    }
    if (!form.valor || isNaN(Number(form.valor))) {
      notify("Informe um valor válido.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      descricao: form.descricao.trim(),
      categoria: form.categoria || null,
      fornecedor: form.fornecedor || null,
      valor: Number(form.valor),
      vencimento: form.vencimento || null,
      pago: form.pago,
      data_pagamento: form.pago ? (form.data_pagamento || todayISO()) : null,
    };
    const { error } = form.id
      ? await supabase.from("contas_pagar").update(payload).eq("id", form.id)
      : await supabase.from("contas_pagar").insert(payload);
    setSaving(false);
    if (error) {
      notify("Não foi possível salvar.", "error");
      return;
    }
    notify(form.id ? "Conta atualizada." : "Conta registrada.");
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("contas_pagar")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) notify("Não foi possível excluir.", "error");
    else {
      notify("Conta removida.");
      load();
    }
    setDeleteTarget(null);
  }

  async function handleMarcarPago(c: ContaPagar) {
    const { error } = await supabase
      .from("contas_pagar")
      .update({ pago: !c.pago, data_pagamento: !c.pago ? todayISO() : null })
      .eq("id", c.id);
    if (error) notify("Erro ao atualizar.", "error");
    else load();
  }

  const hoje = todayISO();

  return (
    <div>
      <PageHeader
        title="Contas a Pagar"
        description="Registre e acompanhe despesas e fornecedores."
        action={
          <ButtonPrimary onClick={openNew}>
            <Plus size={16} /> Nova conta
          </ButtonPrimary>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total pendente"
          value={formatCurrency(stats.totalPendente)}
          hint={`${stats.qtdVencidas} vencida(s)`}
          accent="garnet"
        />
        <StatCard
          label="Total pago"
          value={formatCurrency(stats.totalPago)}
          accent="teal"
        />
        <StatCard
          label="Vencidas"
          value={String(stats.qtdVencidas)}
          hint="contas em atraso"
          accent={stats.qtdVencidas > 0 ? "garnet" : "teal"}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Pesquisar por descrição, fornecedor..."
        />
        <div className="flex gap-1">
          {(["todos", "pendente", "pago"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                filtro === f
                  ? "border-garnet-400 bg-garnet-50 text-garnet-700"
                  : "border-sand-300 bg-white text-ink-600 hover:bg-sand-100"
              }`}
            >
              {f === "todos" ? "Todos" : f === "pendente" ? "Pendente" : "Pago"}
            </button>
          ))}
        </div>
      </div>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50 text-left text-xs font-semibold uppercase tracking-wide text-garnet-600">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3">Fornecedor</th>
                <th className="px-5 py-3">Vencimento</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-ink-300">
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      title="Nenhuma conta encontrada"
                      description="Registre despesas para acompanhar os pagamentos."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const vencida =
                    !c.pago && c.vencimento && c.vencimento < hoje;
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-sand-100 last:border-0 hover:bg-sand-50/60 ${
                        vencida ? "bg-garnet-50/30" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5 text-ink-500 tabular">{c.id}</td>
                      <td className="px-5 py-3.5 font-medium text-ink-900">
                        {c.descricao}
                      </td>
                      <td className="px-5 py-3.5 text-ink-600">
                        {c.categoria ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-ink-600">
                        {c.fornecedor ?? "—"}
                      </td>
                      <td
                        className={`px-5 py-3.5 tabular ${
                          vencida ? "font-semibold text-garnet-600" : "text-ink-700"
                        }`}
                      >
                        {c.vencimento ? formatDate(c.vencimento) : "—"}
                        {vencida && (
                          <span className="ml-1.5 text-[11px] font-bold">VENCIDA</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-ink-900 tabular">
                        {formatCurrency(c.valor)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          className={
                            c.pago
                              ? "bg-lab-teal/10 text-lab-teal"
                              : "bg-garnet-50 text-garnet-500"
                          }
                        >
                          {c.pago ? "Pago" : "Pendente"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <IconButton
                            title={c.pago ? "Desmarcar pago" : "Marcar como pago"}
                            onClick={() => handleMarcarPago(c)}
                          >
                            <CheckCircle
                              size={15}
                              className={c.pago ? "text-lab-teal" : "text-ink-400"}
                            />
                          </IconButton>
                          <IconButton title="Editar" onClick={() => openEdit(c)}>
                            <Pencil size={15} />
                          </IconButton>
                          <IconButton
                            title="Excluir"
                            onClick={() => setDeleteTarget(c)}
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="border-t border-sand-200 px-5 py-3 text-xs text-ink-500">
            Mostrando {filtered.length} de {contas.length} registro(s).
          </div>
        )}
      </Surface>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Editar conta" : "Nova conta a pagar"}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Descrição" className="sm:col-span-2">
            <input
              className={inputClass}
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Ex: Lentes Zeiss, Aluguel..."
            />
          </Field>
          <Field label="Categoria">
            <input
              className={inputClass}
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
              placeholder="Ex: Fornecedor, Aluguel..."
            />
          </Field>
          <Field label="Fornecedor">
            <input
              className={inputClass}
              value={form.fornecedor}
              onChange={(e) => setForm((f) => ({ ...f, fornecedor: e.target.value }))}
            />
          </Field>
          <Field label="Valor (R$)">
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
            />
          </Field>
          <Field label="Vencimento">
            <input
              type="date"
              className={inputClass}
              value={form.vencimento}
              onChange={(e) => setForm((f) => ({ ...f, vencimento: e.target.value }))}
            />
          </Field>
          <Field label="Status" className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.pago}
                onChange={(e) => setForm((f) => ({ ...f, pago: e.target.checked }))}
                className="h-4 w-4 accent-garnet-500"
              />
              <span className="text-sm text-ink-700">Marcar como pago</span>
            </label>
          </Field>
          {form.pago && (
            <Field label="Data do pagamento" className="sm:col-span-2">
              <input
                type="date"
                className={inputClass}
                value={form.data_pagamento}
                onChange={(e) =>
                  setForm((f) => ({ ...f, data_pagamento: e.target.value }))
                }
              />
            </Field>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <ButtonSecondary type="button" onClick={() => setModalOpen(false)}>
            Cancelar
          </ButtonSecondary>
          <ButtonPrimary onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </ButtonPrimary>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir conta"
        description={`Excluir "${deleteTarget?.descricao}"? Esta ação não pode ser desfeita.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
