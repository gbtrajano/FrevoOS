"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, FileOutput } from "lucide-react";
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
import type { Orcamento } from "@/lib/types";

export default function OrcamentosPage() {
  const supabase = getSupabaseBrowserClient();
  const { notify } = useToast();

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Orcamento | null>(null);
  const [convertingId, setConvertingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orcamentos")
      .select("*, clientes(nome)")
      .order("id", { ascending: false });
    if (error) notify("Erro ao carregar orçamentos.", "error");
    setOrcamentos((data as unknown as Orcamento[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orcamentos;
    return orcamentos.filter(
      (o) =>
        o.clientes?.nome.toLowerCase().includes(q) || String(o.id).includes(q)
    );
  }, [orcamentos, query]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("orcamentos")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      notify("Não foi possível excluir o orçamento.", "error");
    } else {
      notify("Orçamento removido.");
      load();
    }
    setDeleteTarget(null);
  }

  async function handleGerarOS(orcamento: Orcamento) {
    setConvertingId(orcamento.id);
    const { data: itensOrc } = await supabase
      .from("orcamento_itens")
      .select("*")
      .eq("orcamento_id", orcamento.id);

    const { data: novaOs, error } = await supabase
      .from("ordens_servico")
      .insert({
        cliente_id: orcamento.cliente_id,
        orcamento_id: orcamento.id,
        status: "solicitado",
        observacoes: orcamento.observacoes,
      })
      .select("id")
      .single();

    if (error || !novaOs) {
      setConvertingId(null);
      notify("Não foi possível gerar a OS.", "error");
      return;
    }

    if (itensOrc && itensOrc.length > 0) {
      await supabase.from("os_itens").insert(
        itensOrc.map((it) => ({
          os_id: novaOs.id,
          produto_id: it.produto_id,
          descricao: it.descricao,
          quantidade: it.quantidade,
          valor_unitario: it.valor_unitario,
        }))
      );
    }

    await supabase
      .from("orcamentos")
      .update({ aprovado: true })
      .eq("id", orcamento.id);

    setConvertingId(null);
    notify(`OS #${novaOs.id} gerada a partir do orçamento.`);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Monte e acompanhe orçamentos para seus clientes."
        action={
          <Link href="/orcamentos/novo">
            <ButtonPrimary>
              <Plus size={16} /> Novo orçamento
            </ButtonPrimary>
          </Link>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Pesquisar por cliente ou número..."
        />
      </div>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50 text-left text-xs font-semibold uppercase tracking-wide text-garnet-600">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Aprovado</th>
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
                      title="Nenhum orçamento encontrado"
                      description="Crie um novo orçamento para um cliente."
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
                      <Badge
                        className={
                          o.aprovado
                            ? "bg-lab-teal/10 text-lab-teal"
                            : "bg-garnet-50 text-garnet-500"
                        }
                      >
                        {o.aprovado ? "Sim" : "Não"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-ink-900 tabular">
                      {formatCurrency(o.valor_total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <IconButton
                          title="Gerar OS"
                          onClick={() => handleGerarOS(o)}
                          disabled={convertingId === o.id}
                        >
                          <FileOutput size={15} />
                        </IconButton>
                        <Link href={`/orcamentos/${o.id}`}>
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
            Mostrando {filtered.length} de {orcamentos.length} registro(s).
          </div>
        )}
      </Surface>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir orçamento"
        description={`Tem certeza que deseja excluir o orçamento #${deleteTarget?.id}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
