import { notFound } from "next/navigation";
import { getSubjectByCode } from "@/config/mock/subjects";
import { SubjectDetailView } from "@/components/disciplinas/SubjectDetailView";

interface SubjectDetailPageProps {
  params: Promise<{ code: string }>;
}

export default async function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const { code } = await params;
  const subject = getSubjectByCode(code);
  if (!subject) notFound();
  return <SubjectDetailView subject={subject} />;
}
