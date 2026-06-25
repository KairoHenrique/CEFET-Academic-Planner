interface PageHeaderProps {
  eyebrow: string;
  title: string;
  highlight?: string;
  subtitle?: string;
}

export function PageHeader({ eyebrow, title, highlight, subtitle }: PageHeaderProps) {
  return (
    <header className="page-header col-12">
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
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </header>
  );
}
