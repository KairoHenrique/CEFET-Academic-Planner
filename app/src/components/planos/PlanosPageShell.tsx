interface PlanosPageShellProps {
  children: React.ReactNode;
}

export function PlanosPageShell({ children }: PlanosPageShellProps) {
  return <div className="planos-page animate-fade-in">{children}</div>;
}
