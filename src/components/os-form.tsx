"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Printer, Save, X } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast-context";
import { ButtonPrimary, ButtonSecondary, Field, Surface, inputClass } from "@/components/ui";
import { ItensEditor } from "@/components/itens-editor";
import { todayISO } from "@/lib/utils";
import {
  STATUS_OS_LABELS,
  type Cliente,
  type ItemPedido,
  type Produto,
  type StatusOS,
} from "@/lib/types";

const LOGO_KEY = "otica_logo_b64";

export function OsForm({ osId }: { osId?: number }) {
  const supabase = getSupabaseBrowserClient();
  const { notify } = useToast();
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [data, setData] = useState(todayISO());
  const [status, setStatus] = useState<StatusOS>("solicitado");
  const [observacoes, setObservacoes] = useState("");
  const [desconto, setDesconto] = useState<number>(0);
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [loading, setLoading] = useState(!!osId);
  const [saving, setSaving] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [savedOsId, setSavedOsId] = useState<number | undefined>(osId);

  // Load logo from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LOGO_KEY);
    if (stored) setLogoSrc(stored);
  }, []);

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
          setDesconto(Number(osRes.data.desconto) || 0);
        }
        setItens((itensRes.data as ItemPedido[]) ?? []);
        setLoading(false);
      }
    }
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osId]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setLogoSrc(b64);
      localStorage.setItem(LOGO_KEY, b64);
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogoSrc(null);
    localStorage.removeItem(LOGO_KEY);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  const subtotal = itens.reduce((acc, it) => acc + it.quantidade * it.valor_unitario, 0);
  const totalComDesconto = Math.max(0, subtotal - desconto);

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
      desconto: desconto || 0,
      valor_total: totalComDesconto,
    };

    let id = osId ?? savedOsId;
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
      setSavedOsId(id);
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

    // After save, redirect to print page or list
    router.push("/os");
  }

  async function handleSaveAndPrint() {
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
      desconto: desconto || 0,
      valor_total: totalComDesconto,
    };

    let id = osId ?? savedOsId;
    if (id) {
      const { error } = await supabase
        .from("ordens_servico")
        .update(payload)
        .eq("id", id);
      if (error) {
        setSaving(false);
        notify("Não foi possível salvar a OS.", "error");
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
      setSavedOsId(id);
    }

    const itensPayload = itens.map((it) => ({
      os_id: id,
      produto_id: it.produto_id,
      descricao: it.descricao,
      quantidade: it.quantidade,
      valor_unitario: it.valor_unitario,
    }));
    await supabase.from("os_itens").insert(itensPayload);

    setSaving(false);
    notify("OS salva! Abrindo impressão...");
    router.push(`/os/${id}/imprimir`);
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
        {/* Logo da Ótica */}
        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">Logo da ótica (aparece na impressão)</p>
          <div className="flex items-center gap-4">
            {logoSrc ? (
              <div className="relative flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoSrc}
                  alt="Logo"
                  className="h-16 max-w-[160px] rounded-lg border border-sand-200 object-contain p-1"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-garnet-100 text-garnet-500 hover:bg-garnet-200"
                  title="Remover logo"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-dashed border-sand-300 bg-sand-50 px-4 py-3 text-sm text-ink-500 transition hover:border-garnet-300 hover:text-garnet-500"
              >
                <ImagePlus size={16} /> Selecionar logo
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
            {logoSrc && (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="text-xs text-ink-400 underline hover:text-garnet-500"
              >
                Trocar logo
              </button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink-400">
            A logo é salva no navegador e aparecerá automaticamente em todas as OS impressas.
          </p>
        </div>

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

        {/* Desconto */}
        <div className="flex items-end justify-end gap-6">
          <div className="w-48">
            <Field label="Desconto (R$)">
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={desconto === 0 ? "" : desconto}
                placeholder="0,00"
                onChange={(e) => setDesconto(Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <div className="pb-2.5 text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Total com desconto</p>
            <p className="font-display text-xl font-bold text-garnet-600 tabular">
              {totalComDesconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
        </div>

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

        <div className="flex flex-wrap justify-end gap-2 border-t border-sand-200 pt-5">
          <ButtonSecondary
            type="button"
            onClick={handleSaveAndPrint}
            disabled={saving}
          >
            <Printer size={16} />
            {saving ? "Salvando..." : "Salvar e Imprimir / PDF"}
          </ButtonSecondary>
          <ButtonPrimary onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? "Salvando..." : "Salvar OS"}
          </ButtonPrimary>
        </div>
      </Surface>
    </div>
  );
}
