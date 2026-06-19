"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast-context";
import { ButtonPrimary, Field, Surface, inputClass } from "@/components/ui";
import { ItensEditor } from "@/components/itens-editor";
import { todayISO } from "@/lib/utils";
import {
  STATUS_OS_LABELS,
  type Cliente,
  type ItemPedido,
  type Produto,
  type StatusOS,
} from "@/lib/types";

export function OsForm({ osId }: { osId?: number }) {
  const supabase = getSupabaseBrowserClient();
  const { notify } = useToast();
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [data, setData] = useState(todayISO());
  const [status, setStatus] = useState<StatusOS>("solicitado");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [loading, setLoading] = useState(!!osId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadBase() {
      const [clientesRes, produtosRes] = await Promise.all([
        supabase.from("clientes").select("*").eq("status", "ativo").order("nome"),
        supabase.from("produtos").select("*").eq("status", "ativo").order("nome"),
      ]);
      setClientes((clientesRes.data as Cliente[]) ?? []);
      setProdutos((produtosRes.data as Produto[]) ?? []);

      if (osId) {
        const [osRes, itensRes] = await Promise.all([
          supabase.from("ordens_servico").select("*").eq("id", osId).single(),
          supabase.from("os_itens").select("*").eq("os_id", osId),
        ]);
        if (osRes.data) {
          setClienteId(String(osRes.data.cliente_id ?? ""));
          setData(osRes.data.data);
          setStatus(osRes.data.status);
          setObservacoes(osRes.data.observacoes ?? "");
        }
        setItens((itensRes.data as ItemPedido[]) ?? []);
        setLoading(false);
      }
    }
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osId]);

  async function handleSave() {
    if (!clienteId) {
      notify("Selecione um cliente.", "error");
      return;
    }
    if (itens.length === 0) {
      notify("Adicione pelo menos um item à OS.", "error");
      return;
    }
    setSaving(true);

    const payload = {
      cliente_id: Number(clienteId),
      data,
      status,
      observacoes: observacoes || null,
    };

    let id = osId;
    if (id) {
      const { error } = await supabase
        .from("ordens_servico")
        .update(payload)
        .eq("id", id);
      if (error) {
        setSaving(false);
        notify("Não foi possível atualizar a OS.", "error");
        return;
      }
      await supabase.from("os_itens").delete().eq("os_id", id);
    } else {
      const { data: inserted, error } = await supabase
        .from("ordens_servico")
        .insert(payload)
        .select("id")
        .single();
      if (error || !inserted) {
        setSaving(false);
        notify("Não foi possível criar a OS.", "error");
        return;
      }
      id = inserted.id;
    }

    const itensPayload = itens.map((it) => ({
      os_id: id,
      produto_id: it.produto_id,
      descricao: it.descricao,
      quantidade: it.quantidade,
      valor_unitario: it.valor_unitario,
    }));
    const { error: itensError } = await supabase
      .from("os_itens")
      .insert(itensPayload);

    setSaving(false);
    if (itensError) {
      notify("OS salva, mas houve erro ao salvar os itens.", "error");
      return;
    }
    notify(osId ? "OS atualizada." : "OS criada.");
    router.push("/os");
  }

  if (loading) {
    return <p className="py-10 text-center text-ink-300">Carregando...</p>;
  }

  return (
    <div>
      <Link
        href="/os"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-garnet-500"
      >
        <ArrowLeft size={15} /> Voltar para ordens de serviço
      </Link>

      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">
        {osId ? `Editar OS #${osId}` : "Nova ordem de serviço"}
      </h1>

      <Surface className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Cliente" className="sm:col-span-2">
            <select
              className={inputClass}
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Data">
            <input
              type="date"
              className={inputClass}
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Itens da OS">
          <ItensEditor itens={itens} produtos={produtos} onChange={setItens} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusOS)}
            >
              {Object.entries(STATUS_OS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Observações">
            <textarea
              rows={2}
              className={inputClass}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-sand-200 pt-5">
          <ButtonPrimary onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? "Salvando..." : "Salvar OS"}
          </ButtonPrimary>
        </div>
      </Surface>
    </div>
  );
}
