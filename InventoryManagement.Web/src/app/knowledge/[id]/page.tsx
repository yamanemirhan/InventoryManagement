import { KnowledgeDetail } from "@/features/workspace/knowledge";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KnowledgeDetail id={id} />;
}
