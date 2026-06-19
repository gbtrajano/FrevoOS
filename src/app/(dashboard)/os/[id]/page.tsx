import { OsForm } from "@/components/os-form";

export default function EditarOsPage({
  params,
}: {
  params: { id: string };
}) {
  return <OsForm osId={Number(params.id)} />;
}
