import { SubjectDetailView } from "@/components/disciplinas/SubjectDetailView";

interface SubjectDetailPageProps {
  params: Promise<{ code: string }>;
}

export default async function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const { code } = await params;
  return <SubjectDetailView code={decodeURIComponent(code)} />;
}
