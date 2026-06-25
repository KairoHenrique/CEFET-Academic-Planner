import Link from "next/link";
import { PageGrid } from "@/components/layout/PageGrid";
import { Icon } from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <PageGrid>
      <div className="col-12 not-found">
        <h1>Página não encontrada</h1>
        <p>O recurso que você buscou não existe ou ainda não foi implementado.</p>
        <Link href="/" className="btn-gold">
          <Icon name="dashboard" size={16} />
          Voltar ao dashboard
        </Link>
      </div>
    </PageGrid>
  );
}
