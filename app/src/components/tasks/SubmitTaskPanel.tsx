"use client";

import { useId, useRef, useState } from "react";
import {
  submitTarefaToSigaa,
  getTaskSubmissionStatus,
  ApiClientError,
} from "@/lib/api/client";
import { pollTaskSubmissionUntilDone } from "@/lib/task-submissions/poll-submission-status";
import type { AcademicTask } from "@/lib/types/task";
import { Icon } from "@/components/ui/Icon";
import { SubmitTaskResult } from "./SubmitTaskResult";

const MAX_BYTES = 10 * 1024 * 1024;

type Props = {
  task: AcademicTask;
  onSubmitted?: () => void;
  onCancel?: () => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SubmitTaskPanel({ task, onSubmitted, onCancel }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const commentId = useId();
  const fileId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{
    ok: boolean;
    title: string;
    message: string;
  } | null>(null);

  if (task.done) {
    return (
      <p className="modal-hint">Esta tarefa já está marcada como concluída.</p>
    );
  }

  if (task.manual) {
    return (
      <p className="modal-hint">
        Tarefas criadas manualmente não são enviadas ao SIGAA.
      </p>
    );
  }

  if (!task.submittable) {
    return (
      <p className="modal-hint">
        Esta tarefa ainda não tem vínculo com o portal. Sincronize e abra de
        novo para enviar o arquivo no SIGAA.
      </p>
    );
  }

  function acceptFile(next: File | null) {
    if (!next) {
      setFile(null);
      return;
    }
    if (next.size > MAX_BYTES) {
      setError("Arquivo excede 10 MB (limite do SIGAA).");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setError(null);
    setFile(next);
  }

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0] ?? null);
  }

  function onDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setDragging(true);
  }

  function onDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    if (busy) return;
    acceptFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Selecione ou arraste o arquivo da entrega.");
      return;
    }

    setBusy(true);
    setProcessing(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      if (comment.trim()) form.append("comment", comment.trim());
      const result = await submitTarefaToSigaa(task.id, form);

      if (result.deviceRequired || result.status === "device_required") {
        setOutcome({
          ok: false,
          title: "Não foi possível enviar",
          message:
            "Não foi possível enviar agora. Tente novamente em alguns minutos.",
        });
        return;
      }

      const poll = await pollTaskSubmissionUntilDone(
        () => getTaskSubmissionStatus(task.id, result.submissionId),
        { dryRun: false }
      );

      setComment("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";

      if (poll.kind === "completed") {
        setOutcome({
          ok: true,
          title: "Tarefa enviada",
          message: poll.message,
        });
        onSubmitted?.();
        return;
      }

      setOutcome({
        ok: false,
        title: "Não foi possível enviar",
        message: poll.message,
      });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível enviar a tarefa.";
      setError(message);
      setOutcome({ ok: false, title: "Não foi possível enviar", message });
    } finally {
      setBusy(false);
      setProcessing(false);
    }
  }

  if (outcome) {
    return (
      <SubmitTaskResult
        ok={outcome.ok}
        title={outcome.title}
        message={outcome.message}
        onDismiss={() => {
          setOutcome(null);
          onCancel?.();
        }}
        onRetry={
          outcome.ok
            ? undefined
            : () => {
                setOutcome(null);
                setError(null);
              }
        }
      />
    );
  }

  if (processing) {
    return (
      <div className="task-submit-processing" role="status" aria-live="polite">
        <span className="task-submit-processing-icon" aria-hidden>
          <Icon name="sync" size={22} />
        </span>
        <h3 className="task-submit-processing-title">Enviando no SIGAA…</h3>
        <p className="modal-hint">
          Estamos enviando sua tarefa. Isso pode levar alguns segundos — só
          confirmamos quando o SIGAA receber.
        </p>
      </div>
    );
  }

  return (
    <form className="modal-form-stack task-submit-panel" onSubmit={onSubmit}>
      <p className="modal-hint">
        Arraste o arquivo ou clique para escolher. Se quiser, deixe um
        comentário para o professor.
      </p>

      <div className="form-field">
        <span className="form-label" id={`${fileId}-label`}>
          Arquivo da entrega
        </span>
        <input
          ref={fileRef}
          id={fileId}
          type="file"
          className="sr-only"
          onChange={onPickFile}
          disabled={busy}
          aria-labelledby={`${fileId}-label`}
        />
        <button
          type="button"
          className={`task-submit-dropzone${file ? " is-filled" : ""}${
            dragging ? " is-dragging" : ""
          }`}
          onClick={() => fileRef.current?.click()}
          onDragEnter={onDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          disabled={busy}
          aria-describedby={`${fileId}-hint`}
        >
          <span className="task-submit-dropzone-row">
            <Icon name="plus" size={14} />
            <span className="task-submit-dropzone-name">
              {file
                ? file.name
                : dragging
                  ? "Solte o arquivo aqui"
                  : "Arraste ou escolha o arquivo"}
            </span>
          </span>
          <span id={`${fileId}-hint`} className="form-hint">
            {file
              ? formatFileSize(file.size)
              : "PDF, código ou documento · até 10 MB"}
          </span>
        </button>
      </div>

      <label className="form-field" htmlFor={commentId}>
        <span className="form-label">
          Comentário ao professor
          <span className="form-label-optional"> opcional</span>
        </span>
        <textarea
          id={commentId}
          className="form-input form-textarea"
          rows={4}
          placeholder="Visível no SIGAA"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          disabled={busy}
          maxLength={8000}
        />
      </label>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="modal-form-actions">
        {onCancel ? (
          <button
            type="button"
            className="btn-outline"
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </button>
        ) : null}
        <button type="submit" className="btn-gold" disabled={busy || !file}>
          <Icon name="check" size={14} />
          {busy ? "Enviando…" : "Enviar tarefa"}
        </button>
      </div>
    </form>
  );
}
