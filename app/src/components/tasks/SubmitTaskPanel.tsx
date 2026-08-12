"use client";

import { useRef, useState } from "react";
import { submitTarefaToSigaa } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/client";
import type { AcademicTask } from "@/lib/types/task";
import { Icon } from "@/components/ui/Icon";

const MAX_BYTES = 10 * 1024 * 1024;

type Props = {
  task: AcademicTask;
  onSubmitted?: () => void;
};

export function SubmitTaskPanel({ task, onSubmitted }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!task.submittable || task.done) return null;

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Arquivo excede 10 MB (limite do SIGAA).");
      event.target.value = "";
      setFileName(null);
      return;
    }
    setError(null);
    setSuccess(null);
    setFileName(file.name);
  }

  async function onSubmit() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Selecione o arquivo da entrega.");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const form = new FormData();
      form.append("file", file);
      if (comment.trim()) {
        form.append("comment", comment.trim());
      }
      const result = await submitTarefaToSigaa(task.id, form);
      setSuccess(result.message);
      setComment("");
      setFileName(null);
      if (fileRef.current) fileRef.current.value = "";
      onSubmitted?.();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível enviar a tarefa."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="detail-block task-submit-panel">
      <h4 className="detail-block-title">Enviar no SIGAA</h4>
      <p className="detail-description">
        Escolha o arquivo e, se quiser, deixe um comentário para o professor —
        igual à tela &quot;Responder tarefa&quot; do portal.
      </p>

      <input
        ref={fileRef}
        type="file"
        className="task-submit-file-input"
        onChange={onPickFile}
        aria-label="Arquivo da entrega"
      />

      <button
        type="button"
        className="btn-outline task-submit-file-btn"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
      >
        <Icon name="plus" size={14} />
        {fileName ? fileName : "Escolher arquivo"}
      </button>

      <label className="task-submit-label" htmlFor={`task-comment-${task.id}`}>
        Comentários visíveis ao professor
      </label>
      <textarea
        id={`task-comment-${task.id}`}
        className="form-textarea task-submit-comment"
        rows={4}
        placeholder="Opcional"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        disabled={busy}
        maxLength={8000}
      />

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="task-submit-success" role="status">
          {success}
        </p>
      ) : null}

      <div className="detail-actions task-submit-actions">
        <button
          type="button"
          className="btn-gold"
          onClick={() => void onSubmit()}
          disabled={busy}
        >
          <Icon name="check" size={14} />
          {busy ? "Enviando…" : "Enviar tarefa"}
        </button>
      </div>
    </div>
  );
}
