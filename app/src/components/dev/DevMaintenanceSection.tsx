"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { useDevMaintenancePolicy, useDevPutMaintenancePolicy } from "@/hooks/useDevPanel";
import { DevSectionHeader } from "@/components/dev/DevSectionHeader";
import { ToggleOption } from "@/components/ui/ToggleOption";

export function DevMaintenanceSection() {
  const { data, isLoading, isError } = useDevMaintenancePolicy(true);
  const mutation = useDevPutMaintenancePolicy();

  const [enabled, setEnabled] = useState(false);
  const [pages, setPages] = useState("/*");
  const [message, setMessage] = useState("Nosso site estará temporariamente indisponível para uma atualização do sistema. Voltaremos em breve!");

  useEffect(() => {
    if (data?.policy) {
      setEnabled(data.policy.enabled);
      setPages(data.policy.pages);
      setMessage(data.policy.message);
    }
  }, [data]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await mutation.mutateAsync({ enabled, pages, message });
  }

  if (isLoading) {
    return (
      <section className="card">
        <p className="dev-empty-state">Carregando política de manutenção...</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="card">
        <p className="form-error" role="alert">Erro ao carregar política de manutenção.</p>
      </section>
    );
  }

  const actions = (
    <div className="dev-run-actions">
      <button 
        type="button" 
        className="btn-gold dev-action-btn"
        disabled={mutation.isPending}
        onClick={(e) => void handleSave(e)}
      >
        {mutation.isPending ? "Salvando..." : "Salvar Configuração"}
      </button>
    </div>
  );

  return (
    <section className="card" aria-labelledby="dev-maintenance-title">
      <DevSectionHeader
        icon="warning"
        title="Configuração do Popup"
        titleId="dev-maintenance-title"
        subtitle="Defina onde e como o popup in-fechável será exibido."
        actions={actions}
      />

      <div className="dev-policy-grid mt-4">
        <fieldset className="dev-policy-group">
          <legend className="dev-policy-group-title">Status Global</legend>
          <div className="dev-policy-row">
            <ToggleOption
              label="Ativar Manutenção Global"
              checked={enabled}
              onChange={setEnabled}
              disabled={mutation.isPending}
            />
          </div>
        </fieldset>

        <fieldset className="dev-policy-group">
          <legend className="dev-policy-group-title">Páginas e Mensagem</legend>
          <div className="dev-policy-row" style={{ flexWrap: 'wrap' }}>
            <label className="form-field dev-policy-field" style={{ minWidth: "100%" }}>
              <span className="form-label">Páginas Afetadas</span>
              <select 
                className="form-input" 
                value={pages} 
                onChange={e => setPages(e.target.value)}
              >
                <option value="/*">Global (Todas as Páginas)</option>
                <option value="/">Home (/)</option>
                <option value="/simulador">Simulador</option>
                <option value="/mapa">Mapa de Pré-requisitos</option>
                <option value="/calendario">Calendário</option>
                <option value="/integralizacao">Integralização</option>
                <option value="/disciplinas">Disciplinas</option>
                <option value="/perfil">Perfil</option>
                <option value="/planos">Planos</option>
              </select>
            </label>
            
            <label className="form-field dev-policy-field" style={{ minWidth: "100%" }}>
              <span className="form-label">Mensagem do Popup</span>
              <textarea 
                className="form-input" 
                style={{ resize: "vertical", minHeight: "80px" }}
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                placeholder="Mensagem exibida aos usuários..."
              />
            </label>
          </div>
        </fieldset>
      </div>
    </section>
  );
}
