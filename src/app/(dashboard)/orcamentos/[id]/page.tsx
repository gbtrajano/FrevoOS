import { OrcamentoForm } from "@/components/orcamento-form";

export default function EditarOrcamentoPage({
  params,
}: {
  params: { id: string };
}) {
  return <OrcamentoForm orcamentoId={Number(params.id)} />;
}
