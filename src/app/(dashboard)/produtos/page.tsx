"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Tags,
  X as XIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  Surface,
  inputClass,
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import type { Categoria, Produto } from "@/lib/types";

const EMPTY_FORM = {
  id: undefined as number | undefined,
  nome: "",
  tipo_lente: "",
  categoria_id: "" as string,
  preco: "",
  custo: "",
  estoque: "",
  estoque_minimo: "3",
  status: "ativo" as "ativo" | "inativo",
};

export default function ProdutosPage() {
  const supabase = getSupabaseBrowserClient();
  const { notify } = useToast();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Produto | null>(null);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  async function load() {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      supabase
        .from("produtos")
        .select("*, categorias(nome)")
        .order("id", { ascending: false }),
      supabase.from("categorias").select("*").order("nome"),
    ]);
    if (prodRes.error) notify("Erro ao carregar produtos.", "error");
    setProdutos((prodRes.data as unknown as Produto[]) ?? []);
    setCategorias((catRes.data as Categoria[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = produtos;
    if (categoriaFiltro !== "todos") {
      list = list.filter((p) => String(p.categoria_id) === categoriaFiltro);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.tipo_lente?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [produtos, query, categoriaFiltro]);

  const stockStats = useMemo(() => {
    const custoTotal = produtos.reduce(
      (acc, p) => acc + p.custo * p.estoque,
      0
    );
    const vendaTotal = produtos.reduce(
      (acc, p) => acc + p.preco * p.estoque,
      0
    );
    return {
      custoTotal,
      vendaTotal,
      lucro: vendaTotal - custoTotal,
    };
  }, [produtos]);

  const criticalStock = useMemo(() => {
    return [...produtos]
      .filter((p) => p.estoque <= p.estoque_minimo)
      .sort((a, b) => a.estoque - b.estoque)
      .slice(0, 5)
      .map((p) => ({
        nome: p.nome.length > 18 ? p.nome.slice(0, 18) + "…" : p.nome,
        Estoque: p.estoque,
        Mínimo: p.estoque_minimo,
      }));
  }, [produtos]);

  function openNew() {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(p: Produto) {
    setForm({
      id: p.id,
      nome: p.nome,
      tipo_lente: p.tipo_lente ?? "",
      categoria_id: p.categoria_id ? String(p.categoria_id) : "",
      preco: String(p.preco),
      custo: String(p.custo),
      estoque: String(p.estoque),
      estoque_minimo: String(p.estoque_minimo),
      status: p.status,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      notify("Informe o nome do produto.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      tipo_lente: form.tipo_lente || null,
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      preco: Number(form.preco) || 0,
      custo: Number(form.custo) || 0,
      estoque: Number(form.estoque) || 0,
      estoque_minimo: Number(form.estoque_minimo) || 0,
      status: form.status,
    };
    const { error } = form.id
      ? await supabase.from("produtos").update(payload).eq("id", form.id)
      : await supabase.from("produtos").insert(payload);

    setSaving(false);
    if (error) {
      notify("Não foi possível salvar o produto.", "error");
      return;
    }
    notify(form.id ? "Produto atualizado." : "Produto cadastrado.");
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("produtos")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      notify("Não foi possível excluir este produto.", "error");
    } else {
      notify("Produto removido.");
      load();
    }
    setDeleteTarget(null);
  }

  async function handleAddCategoria() {
    if (!newCatName.trim()) return;
    const { error } = await supabase
      .from("categorias")
      .insert({ nome: newCatName.trim() });
    if (error) {
      notify("Não foi possível criar a categoria.", "error");
    } else {
      notify("Categoria criada.");
      setNewCatName("");
      load();
    }
  }

  async function handleDeleteCategoria(id: number) {
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) {
      notify("Categoria em uso por produtos não pode ser removida.", "error");
    } else {
      notify("Categoria removida.");
      load();
    }
  }

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Lentes, armações e itens em estoque."
        action={
          <div className="flex gap-2">
            <ButtonSecondary onClick={() => setCatModalOpen(true)}>
              <Tags size={16} /> Categorias
            </ButtonSecondary>
            <ButtonPrimary onClick={openNew}>
              <Plus size={16} /> Novo produto
            </ButtonPrimary>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Surface className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">
            Estoque crítico (top 5 itens)
          </h3>
          {criticalStock.length === 0 ? (
            <p className="flex h-48 items-center justify-center text-sm text-ink-300">
              Nenhum item abaixo do estoque mínimo. 🎉
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={criticalStock} barGap={4}>
                <CartesianGrid vertical={false} stroke="#ECE1DD" />
                <XAxis
                  dataKey="nome"
                  tick={{ fontSize: 11, fill: "#6B5860" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11, fill: "#6B5860" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #ECE1DD",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="Estoque" fill="#B3122B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Mínimo" fill="#E4B73B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Surface>

        <Surface className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-ink-700">
            Valor total do estoque
          </h3>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-ink-500">Custo total</dt>
              <dd className="font-display font-bold text-ink-900 tabular">
                {formatCurrency(stockStats.custoTotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-ink-500">Venda total estimada</dt>
              <dd className="font-display font-bold text-ink-900 tabular">
                {formatCurrency(stockStats.vendaTotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-sand-200 pt-3">
              <dt className="text-sm text-ink-500">Lucro estimado</dt>
              <dd className="font-display font-bold text-lab-teal tabular">
                {formatCurrency(stockStats.lucro)}
              </dd>
            </div>
          </dl>
        </Surface>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Pesquisar produto..."
        />
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className={inputClass + " sm:w-56"}
        >
          <option value="todos">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nome}
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
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Lente</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3">Preço</th>
                <th className="px-5 py-3">Estoque</th>
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
                      title="Nenhum produto encontrado"
                      description="Cadastre lentes, armações ou acessórios para começar a montar orçamentos."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-sand-100 last:border-0 hover:bg-sand-50/60"
                  >
                    <td className="px-5 py-3.5 text-ink-500 tabular">{p.id}</td>
                    <td className="px-5 py-3.5 font-medium text-ink-900">
                      {p.nome}
                    </td>
                    <td className="px-5 py-3.5 text-ink-700">
                      {p.tipo_lente || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-ink-700">
                      {p.categorias?.nome || "—"}
                    </td>
                    <td className="px-5 py-3.5 tabular text-ink-900">
                      {formatCurrency(p.preco)}
                    </td>
                    <td className="px-5 py-3.5 tabular">
                      <span
                        className={
                          p.estoque <= p.estoque_minimo
                            ? "font-semibold text-garnet-500"
                            : "text-ink-900"
                        }
                      >
                        {p.estoque}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        className={
                          p.status === "ativo"
                            ? "bg-lab-teal/10 text-lab-teal"
                            : "bg-ink-300/10 text-ink-500"
                        }
                      >
                        {p.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <IconButton onClick={() => openEdit(p)}>
                          <Pencil size={15} />
                        </IconButton>
                        <IconButton onClick={() => setDeleteTarget(p)}>
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
            Mostrando {filtered.length} de {produtos.length} registro(s).
          </div>
        )}
      </Surface>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Editar produto" : "Novo produto"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" className="sm:col-span-2">
            <input
              className={inputClass}
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: VS 1.56 FOTO + BLUE + AR"
            />
          </Field>
          <Field label="Tipo de lente / material">
            <input
              className={inputClass}
              value={form.tipo_lente}
              onChange={(e) =>
                setForm({ ...form, tipo_lente: e.target.value })
              }
              placeholder="policarbonato"
            />
          </Field>
          <Field label="Categoria">
            <select
              className={inputClass}
              value={form.categoria_id}
              onChange={(e) =>
                setForm({ ...form, categoria_id: e.target.value })
              }
            >
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preço de venda (R$)">
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: e.target.value })}
            />
          </Field>
          <Field label="Custo (R$)">
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={form.custo}
              onChange={(e) => setForm({ ...form, custo: e.target.value })}
            />
          </Field>
          <Field label="Estoque atual">
            <input
              type="number"
              className={inputClass}
              value={form.estoque}
              onChange={(e) => setForm({ ...form, estoque: e.target.value })}
            />
          </Field>
          <Field label="Estoque mínimo">
            <input
              type="number"
              className={inputClass}
              value={form.estoque_minimo}
              onChange={(e) =>
                setForm({ ...form, estoque_minimo: e.target.value })
              }
            />
          </Field>
          <Field label="Status" className="sm:col-span-2">
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

      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Gerenciar categorias"
        width="max-w-md"
      >
        <div className="flex gap-2">
          <input
            className={inputClass}
            placeholder="Nova categoria"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategoria()}
          />
          <ButtonPrimary onClick={handleAddCategoria}>
            <Plus size={16} />
          </ButtonPrimary>
        </div>
        <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto">
          {categorias.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-sand-50"
            >
              {c.nome}
              <button
                onClick={() => handleDeleteCategoria(c.id)}
                className="text-ink-300 hover:text-garnet-500"
              >
                <XIcon size={14} />
              </button>
            </li>
          ))}
          {categorias.length === 0 && (
            <p className="py-4 text-center text-sm text-ink-300">
              Nenhuma categoria cadastrada.
            </p>
          )}
        </ul>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir produto"
        description={`Tem certeza que deseja excluir "${deleteTarget?.nome}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
