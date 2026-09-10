"use client";

import { useState } from "react";
import type { AcademicTask } from "@/lib/types/task";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { SubmitTaskPanel } from "./SubmitTaskPanel";

type Props = {
  task: AcademicTask;
  onSubmitted?: () => void;
};

/** Substitui “Ver disciplina”: abre modal de envio SIGAA. */
export function SubmitTaskButton({ task, onSubmitted }: Props) {
  const [open, setOpen] = useState(false);

  if (task.done || task.manual) return null;

  return (
    <>
      <button
        type="button"
        className="btn-gold"
        onClick={() => setOpen(true)}
      >
        <Icon name="clipboard" size={14} />
        Enviar tarefa
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Enviar no SIGAA"
        headerAside={task.title}
      >
        <SubmitTaskPanel
          task={task}
          onCancel={() => setOpen(false)}
          onSubmitted={onSubmitted}
        />
      </Modal>
    </>
  );
}
