import { BrandLogo } from "@/components/ui/BrandLogo";
import { brand } from "@/config/brand";

interface LoginCardProps {
  children: React.ReactNode;
  foot?: React.ReactNode;
}

export function LoginCard({ children, foot }: LoginCardProps) {
  return (
    <div className="login-page">
      <div className="login-card card">
        <header className="login-head">
          <div className="login-brand">
            <BrandLogo />
            <div className="login-brand-text">
              <p className="login-institution">{brand.institution}</p>
              <h1 className="login-title">{brand.name}</h1>
            </div>
          </div>
          <p className="login-subtitle">
            Mesmo usuário e senha do portal SIGAA.
          </p>
        </header>

        <div className="login-body">{children}</div>

        {foot && <footer className="login-foot">{foot}</footer>}
      </div>
    </div>
  );
}
