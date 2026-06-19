"use client";

import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { inputClass, ButtonSecondary } from "@/components/ui";
import type { ItemPedido, Produto } from "@/lib/types";

export function ItensEditor({
  itens,
  produtos,
  onChange,
}: {
  itens: ItemPedido[];
  produtos: Produto[];
  onChange: (itens: ItemPedido[]) => void;
}) {
  function updateItem(index: number, patch: Partial<ItemPedido>) {
    const next = itens.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange(next);
  }

  function addItem() {
    onChange([
      ...itens,
      { produto_id: null, descricao: "", quantidade: 1, valor_unitario: 0 },
    ]);
  }

  function removeItem(index: number) {
    onChange(itens.filter((_, i) => i !== index));
  }

  function handleProdutoSelect(index: number, produtoId: string) {
    const produto = produtos.find((p) => p.id === Number(produtoId));
    if (!produto) {
      updateItem(index, { produto_id: null });
      return;
    }
    updateItem(index, {
      produto_id: produto.id,
      descricao: produto.nome,
      valor_unitario: produto.preco,
    });
  }

  const total = itens.reduce(
    (acc, it) => acc + it.quantidade * it.valor_unitario,
    0
  );

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-sand-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-sand-50 text-left text-xs font-semibold uppercase tracking-wide text-garnet-600">
              <th className="px-3 py-2.5">Produto</th>
              <th className="px-3 py-2.5">Descrição</th>
              <th className="w-20 px-3 py-2.5">Qtd.</th>
              <th className="w-32 px-3 py-2.5">Valor unit.</th>
              <th className="w-32 px-3 py-2.5">Subtotal</th>
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {itens.map((item, index) => (
              <tr key={index} className="border-t border-sand-100">
                <td className="px-3 py-2">
                  <select
                    className={inputClass}
                    value={item.produto_id ?? ""}
                    onChange={(e) => handleProdutoSelect(index, e.target.value)}
                  >
                    <option value="">Item manual</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    className={inputClass}
                    value={item.descricao}
                    onChange={(e) =>
                      updateItem(index, { descricao: e.target.value })
                    }
                    placeholder="Descrição do item"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={item.quantidade}
                    onChange={(e) =>
                      updateItem(index, {
                        quantidade: Number(e.target.value) || 1,
                      })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={item.valor_unitario}
                    onChange={(e) =>
                      updateItem(index, {
                        valor_unitario: Number(e.target.value) || 0,
                      })
                    }
                  />
                </td>
                <td className="px-3 py-2 tabular text-ink-700">
                  {formatCurrency(item.quantidade * item.valor_unitario)}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => removeItem(index)}
                    className="text-ink-300 hover:text-garnet-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-ink-300">
                  Nenhum item adicionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <ButtonSecondary type="button" onClick={addItem}>
          <Plus size={15} /> Adicionar item
        </ButtonSecondary>
        <p className="text-sm text-ink-700">
          Total:{" "}
          <span className="font-display text-base font-bold text-ink-900 tabular">
            {formatCurrency(total)}
          </span>
        </p>
      </div>
    </div>
  );
}
