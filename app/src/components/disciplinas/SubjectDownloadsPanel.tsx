"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";

interface SubjectDownloadsPanelProps {
  subjectCode: string;
  subjectName: string;
  downloadedFiles: number;
  initialAutoDownload: boolean;
}

export function SubjectDownloadsPanel({
  subjectCode,
  subjectName,
  downloadedFiles,
  initialAutoDownload,
}: SubjectDownloadsPanelProps) {
  const [autoDownload, setAutoDownload] = useState(initialAutoDownload);
  const folderPath = `docs-downloads/${subjectCode}`;

  return (
    <div className="card">
      <SectionHeader
        title="Materiais e PDFs"
        icon="clipboard"
        badge={<span className="badge info">{downloadedFiles} arquivos</span>}
      />

      <label className="form-checkbox downloads-toggle">
        <input
          type="checkbox"
          checked={autoDownload}
          onChange={(e) => setAutoDownload(e.target.checked)}
        />
        <span>Download automático de PDFs desta disciplina</span>
      </label>

      <p className="panel-footer-note">
        Materiais salvos em <code className="path-code">{folderPath}</code>
      </p>

      <button
        type="button"
        className="btn-outline"
        onClick={() => {
          alert(
            `Em produção, abriria a pasta local:\n${folderPath}\n\n(${subjectName})`
          );
        }}
      >
        <Icon name="books" size={14} />
        Abrir pasta de downloads
      </button>
    </div>
  );
}
