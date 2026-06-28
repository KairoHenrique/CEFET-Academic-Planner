import {
  CH_GLOSSARY,
  CH_GLOSSARY_INTRO,
} from "@/lib/integralizacao/ch-glossary";

export function ChGlossaryContent() {
  return (
    <div className="ch-glossary-modal-body">
      <p className="ch-glossary-intro">{CH_GLOSSARY_INTRO}</p>
      <div className="ch-glossary-grid">
        {CH_GLOSSARY.map((entry) => (
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
                <span>Referência:</span> {entry.regulation}
              </p>
            ) : null}
          </article>
        ))}
      </div>
      <p className="ch-glossary-footer">
        Fontes: PPC Eng. Computação (CEFET-MG Divinópolis), portal DECOM —{" "}
        <a
          href="https://www.decom.cefetmg.br/ensino/graduacao/engenharia-de-computacao/atividades-complementares/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Atividades Complementares
        </a>
        {" · "}
        <a
          href="https://www.dedc.cefetmg.br/faq/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Extensão (DEDC)
        </a>
      </p>
    </div>
  );
}
