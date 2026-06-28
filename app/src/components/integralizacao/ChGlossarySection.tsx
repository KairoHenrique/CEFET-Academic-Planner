import { CH_GLOSSARY } from "@/lib/integralizacao/ch-glossary";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function ChGlossarySection() {
  return (
    <section className="card ch-glossary-card" aria-label="Entenda suas horas">
      <SectionHeader title="Entenda suas horas" icon="help-circle" />
      <p className="ch-glossary-intro">
        Cada tipo de carga horária conta de um jeito no PPC. Veja o que entra em
        cada categoria e exemplos do dia a dia no CEFET.
      </p>
      <div className="ch-glossary-grid">
        {CH_GLOSSARY.map((entry) => (
          <article key={entry.tipoCh} className="ch-glossary-item">
            <h3 className="ch-glossary-item-title">{entry.title}</h3>
            <p className="ch-glossary-item-description">{entry.description}</p>
            <div className="ch-glossary-examples">
              <span className="ch-glossary-examples-label">Exemplos</span>
              <ul>
                {entry.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
