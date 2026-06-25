interface PageGridProps {
  children: React.ReactNode;
}

export function PageGrid({ children }: PageGridProps) {
  return <div className="dashboard-page animate-fade-in">{children}</div>;
}
