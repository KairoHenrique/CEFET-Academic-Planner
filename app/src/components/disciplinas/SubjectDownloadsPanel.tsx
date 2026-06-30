"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";

interface SubjectDownloadsPanelProps {
  subjectName: string;
}

export function SubjectDownloadsPanel({ subjectName }: SubjectDownloadsPanelProps) {
  return (
    <div className="card subject-downloads-card">
      <SectionHeader
        title="Materiais e PDFs"
        icon="clipboard"
        badge={<span className="badge warning">Em breve</span>}
      />

      <p className="subject-downloads-future" role="status">
        Download automático de materiais do SIGAA para nuvem pessoal (Google Drive,
        Dropbox, OneDrive) está no escopo futuro — tasks <strong>B57</strong> e{" "}
        <strong>B29</strong>.
      </p>

      <p className="panel-footer-note">
        Quando disponível, os arquivos de <strong>{subjectName}</strong> irão para{" "}
        <code className="path-code">CEFET Academic Planner/{"{semestre}"}/{"{matéria}"}/</code>
      </p>

      <button type="button" className="btn-outline" disabled aria-disabled="true">
        <Icon name="books" size={14} />
        Conectar nuvem (futuro)
      </button>
    </div>
  );
}
