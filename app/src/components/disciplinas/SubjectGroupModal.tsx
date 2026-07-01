"use client";

import { Modal } from "@/components/ui/Modal";
import type { GrupoMembroDto } from "@/lib/types/disciplinas-api";

interface SubjectGroupModalProps {
  open: boolean;
  onClose: () => void;
  groupName: string | null;
  members: GrupoMembroDto[];
}

function formatCell(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function memberCountLabel(count: number): string {
  return count === 1 ? "1 integrante" : `${count} integrantes`;
}

export function SubjectGroupModal({
  open,
  onClose,
  groupName,
  members,
}: SubjectGroupModalProps) {
  const leadLabel = groupName?.trim() || "Grupo da turma";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Integrantes do grupo"
      headerAside={
        <span className="badge subject-group-modal-badge">
          {memberCountLabel(members.length)}
        </span>
      }
    >
      <p className="subject-group-modal-lead">
        <strong>{leadLabel}</strong>
      </p>
      <div className="data-table-wrap subject-group-table-wrap">
        <table className="data-table subject-group-table">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Matrícula</th>
              <th scope="col">E-mail</th>
              <th scope="col">Curso</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const email = member.email?.trim() || null;
              return (
                <tr key={`${member.matricula ?? member.nome}-${member.nome}`}>
                  <td className="subject-group-name">{member.nome}</td>
                  <td className="subject-group-matricula">
                    {formatCell(member.matricula)}
                  </td>
                  <td>
                    {email ? (
                      <a
                        href={`mailto:${encodeURIComponent(email)}`}
                        className="subject-group-email"
                      >
                        {email}
                      </a>
                    ) : (
                      <span className="subject-group-empty">—</span>
                    )}
                  </td>
                  <td className="subject-group-curso">{formatCell(member.curso)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
