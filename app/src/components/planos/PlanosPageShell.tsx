interface PlanosPageShellProps {
  children: React.ReactNode;
}

export function PlanosPageShell({ children }: PlanosPageShellProps) {
  return <div className="planos-page">{children}</div>;
}
