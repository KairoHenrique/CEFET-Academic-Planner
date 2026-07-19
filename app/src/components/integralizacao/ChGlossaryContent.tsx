"use client";

import {
  CH_GLOSSARY_INTRO,
  getChGlossaryForCurso,
} from "@/lib/integralizacao/ch-glossary";
import { DEFAULT_CURSO_ID } from "@/lib/db/backend/config";

interface ChGlossaryContentProps {
  cursoId?: string;
}

export function ChGlossaryContent({
  cursoId = DEFAULT_CURSO_ID,
}: ChGlossaryContentProps) {
  const glossary = getChGlossaryForCurso(cursoId);

  return (
    <div className="ch-glossary-modal-body">
      <p className="ch-glossary-intro">{CH_GLOSSARY_INTRO}</p>
      <div className="ch-glossary-grid">
        {glossary.map((entry) => (
          <article key={entry.tipoCh} className="ch-glossary-item">
            <header className="ch-glossary-item-header">
              <h3 className="ch-glossary-item-title">{entry.title}</h3>
              <span className="ch-glossary-item-hours">{entry.ppcHours}h</span>
            </header>
            <p className="ch-glossary-item-summary">{entry.summary}</p>
            <p className="ch-glossary-item-description">{entry.description}</p>
            <div className="ch-glossary-examples">
              <span className="ch-glossary-examples-label">Exemplos</span>
              <ul>
                {entry.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
            {entry.regulation ? (
              <p className="ch-glossary-regulation">
                <span>Base:</span> {entry.regulation}
              </p>
            ) : null}
          </article>
        ))}
      </div>
      <p className="ch-glossary-footer">
        Totais conforme o PPC do seu curso cadastrado no ACME HUB.
      </p>
    </div>
  );
}
