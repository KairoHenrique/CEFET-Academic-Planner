"use client";

import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { SubjectApelido } from "@/components/simulador/SubjectApelido";
import {
  ENROLLMENT_COREQUISITO_CANCEL_TITLE,
  ENROLLMENT_COREQUISITO_REMOVE_TITLE,
  ENROLLMENT_COREQUISITO_ROLLBACK_CANCEL_HINT,
  ENROLLMENT_COREQUISITO_ROLLBACK_KICKER,
  ENROLLMENT_COREQUISITO_ROLLBACK_REMOVE_HINT,
} from "@/lib/simulador/enrollment-ui-messages";

interface CorequisitoRollbackSubject {
  shortLabel: string;
  name: string;
}

interface EnrollmentCorequisitoRollbackDialogProps {
  open: boolean;
  mode: "cancel" | "remove";
  primary: CorequisitoRollbackSubject;
  partner: CorequisitoRollbackSubject;
  onConfirm: () => void;
  onCancel: () => void;
}

function CorequisitoRollbackSubjectRow({
  shortLabel,
  name,
}: CorequisitoRollbackSubject) {
  return (
    <span className="enrollment-conflict-notice-subject enrollment-coreq-rollback-subject">
      <SubjectApelido label={shortLabel} />
      <span className="enrollment-conflict-notice-subject-sep" aria-hidden="true">
        ·
      </span>
      <span className="enrollment-conflict-notice-subject-name">{name}</span>
    </span>
  );
}

export function EnrollmentCorequisitoRollbackDialog({
  open,
  mode,
  primary,
  partner,
  onConfirm,
  onCancel,
}: EnrollmentCorequisitoRollbackDialogProps) {
  const title =
    mode === "cancel"
      ? ENROLLMENT_COREQUISITO_CANCEL_TITLE
      : ENROLLMENT_COREQUISITO_REMOVE_TITLE;

  const hint =
    mode === "cancel"
      ? ENROLLMENT_COREQUISITO_ROLLBACK_CANCEL_HINT
      : ENROLLMENT_COREQUISITO_ROLLBACK_REMOVE_HINT;

  const confirmLabel =
    mode === "cancel" ? "Cancelar mesmo assim" : "Remover ambas";

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      headerAside={ENROLLMENT_COREQUISITO_ROLLBACK_KICKER}
    >
      <div className="modal-form-stack enrollment-coreq-rollback-dialog">
        <p className="modal-hint" role="status">
          {hint}
        </p>

        <section
          className="enrollment-coreq-rollback-pair"
          aria-label="Disciplinas em corequisito"
        >
          <p className="enrollment-coreq-rollback-pair-label">Par na grade</p>
          <CorequisitoRollbackSubjectRow {...primary} />
          <div className="enrollment-coreq-rollback-join" aria-hidden="true">
            <span className="enrollment-coreq-rollback-join-line" />
            <span className="enrollment-coreq-rollback-join-label">e</span>
            <span className="enrollment-coreq-rollback-join-line" />
          </div>
          <CorequisitoRollbackSubjectRow {...partner} />
        </section>

        <div className="modal-form-actions enrollment-coreq-rollback-actions">
          <button type="button" className="btn-outline" onClick={onCancel}>
            Voltar
          </button>
          <button
            type="button"
            className="btn-outline btn-danger"
            onClick={onConfirm}
          >
            <Icon name="close" size={14} aria-hidden />
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
