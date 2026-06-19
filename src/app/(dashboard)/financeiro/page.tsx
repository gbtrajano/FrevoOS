"use client";

import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, BarChart3 } from "lucide-react";
import { PageHeader, Surface } from "@/components/ui";

const CARDS = [
  {
    href: "/financeiro/contas-pagar",
    icon: <ArrowUpCircle size={32} className="text-garnet-400" />,
    title: "Contas a Pagar",
    description: "Registre e acompanhe despesas e fornecedores.",
    border: "border-garnet-100",
    hover: "hover:border-garnet-300",
  },
  {
    href: "/financeiro/contas-receber",
    icon: <ArrowDownCircle size={32} className="text-lab-teal" />,
    title: "Contas a Receber",
    description: "Controle recebíveis e pagamentos de clientes.",
    border: "border-teal-100",
    hover: "hover:border-teal-300",
  },
  {
    href: "/financeiro/relatorio",
    icon: <BarChart3 size={32} className="text-lab-navy" />,
    title: "Relatório de Vendas",
    description: "Resumo financeiro com receitas, despesas e resultado.",
    border: "border-blue-100",
    hover: "hover:border-blue-300",
  },
];

export default function FinanceiroPage() {
  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Gerencie as finanças da ótica em um só lugar."
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href}>
            <Surface
              className={`flex cursor-pointer flex-col items-start gap-4 border-2 p-7 transition ${c.border} ${c.hover} hover:shadow-pop`}
            >
              {c.icon}
              <div>
                <p className="font-display text-base font-bold text-ink-900">
                  {c.title}
                </p>
                <p className="mt-1 text-sm text-ink-500">{c.description}</p>
              </div>
            </Surface>
          </Link>
        ))}
      </div>
    </div>
  );
}
