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
import type { Cliente, ItemPedido, Produto } from "@/lib/types";

export function OrcamentoForm({ orcamentoId }: { orcamentoId?: number }) {
  const supabase = getSupabaseBrowserClient();
  const { notify } = useToast();
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [data, setData] = useState(todayISO());
  const [aprovado, setAprovado] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [loading, setLoading] = useState(!!orcamentoId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadBase() {
      const [clientesRes, produtosRes] = await Promise.all([
        supabase.from("clientes").select("*").eq("status", "ativo").order("nome"),
        supabase.from("produtos").select("*").eq("status", "ativo").order("nome"),
      ]);
      setClientes((clientesRes.data as Cliente[]) ?? []);
      setProdutos((produtosRes.data as Produto[]) ?? []);

      if (orcamentoId) {
        const [orcRes, itensRes] = await Promise.all([
          supabase.from("orcamentos").select("*").eq("id", orcamentoId).single(),
          supabase
            .from("orcamento_itens")
            .select("*")
            .eq("orcamento_id", orcamentoId),
        ]);
        if (orcRes.data) {
          setClienteId(String(orcRes.data.cliente_id ?? ""));
          setData(orcRes.data.data);
          setAprovado(orcRes.data.aprovado);
          setObservacoes(orcRes.data.observacoes ?? "");
        }
        setItens((itensRes.data as ItemPedido[]) ?? []);
        setLoading(false);
      }
    }
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orcamentoId]);

  async function handleSave() {
    if (!clienteId) {
      notify("Selecione um cliente.", "error");
      return;
    }
    if (itens.length === 0) {
      notify("Adicione pelo menos um item ao orçamento.", "error");
      return;
    }
    setSaving(true);

    const payload = {
      cliente_id: Number(clienteId),
      data,
      aprovado,
      observacoes: observacoes || null,
    };

    let id = orcamentoId;
    if (id) {
      const { error } = await supabase
        .from("orcamentos")
        .update(payload)
        .eq("id", id);
      if (error) {
        setSaving(false);
        notify("Não foi possível atualizar o orçamento.", "error");
        return;
      }
      await supabase.from("orcamento_itens").delete().eq("orcamento_id", id);
    } else {
      const { data: inserted, error } = await supabase
        .from("orcamentos")
        .insert(payload)
        .select("id")
        .single();
      if (error || !inserted) {
        setSaving(false);
        notify("Não foi possível criar o orçamento.", "error");
        return;
      }
      id = inserted.id;
    }

    const itensPayload = itens.map((it) => ({
      orcamento_id: id,
      produto_id: it.produto_id,
      descricao: it.descricao,
      quantidade: it.quantidade,
      valor_unitario: it.valor_unitario,
    }));
    const { error: itensError } = await supabase
      .from("orcamento_itens")
      .insert(itensPayload);

    setSaving(false);
    if (itensError) {
      notify("Orçamento salvo, mas houve erro ao salvar os itens.", "error");
      return;
    }
    notify(orcamentoId ? "Orçamento atualizado." : "Orçamento criado.");
    router.push("/orcamentos");
  }

  if (loading) {
    return <p className="py-10 text-center text-ink-300">Carregando...</p>;
  }

  return (
    <div>
      <Link
        href="/orcamentos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-garnet-500"
      >
        <ArrowLeft size={15} /> Voltar para orçamentos
      </Link>

      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">
        {orcamentoId ? `Editar orçamento #${orcamentoId}` : "Novo orçamento"}
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

        <Field label="Itens do orçamento">
          <ItensEditor itens={itens} produtos={produtos} onChange={setItens} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Observações">
            <textarea
              rows={2}
              className={inputClass}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </Field>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-sand-300 text-garnet-500 focus:ring-garnet-300"
                checked={aprovado}
                onChange={(e) => setAprovado(e.target.checked)}
              />
              Orçamento aprovado pelo cliente
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-sand-200 pt-5">
          <ButtonPrimary onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? "Salvando..." : "Salvar orçamento"}
          </ButtonPrimary>
        </div>
      </Surface>
    </div>
  );
}
