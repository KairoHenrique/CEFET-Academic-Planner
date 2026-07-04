import { PageTutorialHelpButton } from "@/components/tutorial/PageTutorialHelpButton";
import type { PageTutorialId } from "@/components/tutorial/page-tutorial-steps";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  tutorial?: PageTutorialId;
  tutorialLabel?: string;
}

export function PageHeader({
  eyebrow,
  title,
  highlight,
  subtitle,
  tutorial,
  tutorialLabel,
}: PageHeaderProps) {
  return (
    <header className="page-header col-12">
      <div className="page-header-row">
        <div className="page-header-main">
          <p className="page-header-eyebrow">{eyebrow}</p>
          <h1>
            {highlight ? (
              <>
                {title} <span className="highlight">{highlight}</span>
              </>
            ) : (
              title
            )}
          </h1>
          {subtitle ? <p className="subtitle">{subtitle}</p> : null}
        </div>
        {tutorial ? (
          <PageTutorialHelpButton tutorialId={tutorial} label={tutorialLabel} />
        ) : null}
      </div>
    </header>
  );
}
