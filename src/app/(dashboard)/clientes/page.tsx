"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast-context";
import {
  Badge,
  ButtonPrimary,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Modal,
  PageHeader,
  SearchInput,
  Surface,
  inputClass,
} from "@/components/ui";
import { formatCPF, formatPhone } from "@/lib/utils";
import type { Cliente } from "@/lib/types";

const EMPTY_FORM = {
  id: undefined as number | undefined,
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  endereco: "",
  observacoes: "",
  status: "ativo" as "ativo" | "inativo",
};

export default function ClientesPage() {
  const supabase = getSupabaseBrowserClient();
  const { notify } = useToast();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("id", { ascending: false });
    if (error) notify("Erro ao carregar clientes.", "error");
    setClientes((data as Cliente[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.cpf?.toLowerCase().includes(q) ||
        c.telefone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [clientes, query]);

  function openNew() {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(c: Cliente) {
    setForm({
      id: c.id,
      nome: c.nome,
      cpf: c.cpf ?? "",
      telefone: c.telefone ?? "",
      email: c.email ?? "",
      endereco: c.endereco ?? "",
      observacoes: c.observacoes ?? "",
      status: c.status,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      notify("Informe o nome do cliente.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      cpf: form.cpf || null,
      telefone: form.telefone || null,
      email: form.email || null,
      endereco: form.endereco || null,
      observacoes: form.observacoes || null,
      status: form.status,
    };

    const { error } = form.id
      ? await supabase.from("clientes").update(payload).eq("id", form.id)
      : await supabase.from("clientes").insert(payload);

    setSaving(false);
    if (error) {
      notify("Não foi possível salvar o cliente.", "error");
      return;
    }
    notify(form.id ? "Cliente atualizado." : "Cliente cadastrado.");
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      notify(
        "Não foi possível excluir. Verifique se há orçamentos ou OS vinculados.",
        "error"
      );
    } else {
      notify("Cliente removido.");
      load();
    }
    setDeleteTarget(null);
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Cadastro de clientes da ótica."
        action={
          <ButtonPrimary onClick={openNew}>
            <Plus size={16} /> Novo cliente
          </ButtonPrimary>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Pesquisar por nome, CPF, telefone ou e-mail..."
        />
      </div>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50 text-left text-xs font-semibold uppercase tracking-wide text-garnet-600">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">CPF</th>
                <th className="px-5 py-3">Telefone</th>
                <th className="px-5 py-3">Status</th>
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
                      title="Nenhum cliente encontrado"
                      description="Cadastre o primeiro cliente da sua ótica para começar."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-sand-100 last:border-0 hover:bg-sand-50/60"
                  >
                    <td className="px-5 py-3.5 text-ink-500 tabular">{c.id}</td>
                    <td className="px-5 py-3.5 font-medium text-ink-900">
                      {c.nome}
                    </td>
                    <td className="px-5 py-3.5 text-ink-700 tabular">
                      {c.cpf || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-ink-700 tabular">
                      {c.telefone || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        className={
                          c.status === "ativo"
                            ? "bg-lab-teal/10 text-lab-teal"
                            : "bg-ink-300/10 text-ink-500"
                        }
                      >
                        {c.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <IconButton onClick={() => openEdit(c)}>
                          <Pencil size={15} />
                        </IconButton>
                        <IconButton onClick={() => setDeleteTarget(c)}>
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
            Mostrando {filtered.length} de {clientes.length} registro(s).
          </div>
        )}
      </Surface>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Editar cliente" : "Novo cliente"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" className="sm:col-span-2">
            <input
              className={inputClass}
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Daniel de Sousa Barbosa"
            />
          </Field>
          <Field label="CPF">
            <input
              className={inputClass}
              value={form.cpf}
              onChange={(e) =>
                setForm({ ...form, cpf: formatCPF(e.target.value) })
              }
              placeholder="000.000.000-00"
            />
          </Field>
          <Field label="Telefone">
            <input
              className={inputClass}
              value={form.telefone}
              onChange={(e) =>
                setForm({ ...form, telefone: formatPhone(e.target.value) })
              }
              placeholder="(00) 00000-0000"
            />
          </Field>
          <Field label="E-mail">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as "ativo" | "inativo",
                })
              }
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <input
              className={inputClass}
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            />
          </Field>
          <Field label="Observações" className="sm:col-span-2">
            <textarea
              className={inputClass}
              rows={2}
              value={form.observacoes}
              onChange={(e) =>
                setForm({ ...form, observacoes: e.target.value })
              }
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setModalOpen(false)}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-sand-100"
          >
            Cancelar
          </button>
          <ButtonPrimary onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </ButtonPrimary>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
