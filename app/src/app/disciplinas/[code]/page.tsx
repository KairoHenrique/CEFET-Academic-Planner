import type { Metadata } from "next";
import { SubjectDetailView } from "@/components/disciplinas/SubjectDetailView";

interface SubjectDetailPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({
  params,
}: SubjectDetailPageProps): Promise<Metadata> {
  const { code } = await params;
  return { title: `Disciplina ${decodeURIComponent(code)}` };
}

export default async function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const { code } = await params;
  return <SubjectDetailView code={decodeURIComponent(code)} />;
}
