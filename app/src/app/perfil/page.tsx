import React from 'react';
import styles from './perfil.module.css';

export default function PerfilPage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Meu Perfil</h1>
        <p className={styles.subtitle}>Gerencie suas informações e preferências do sistema.</p>
      </header>

      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2>🔔 Preferências de Notificação (Push)</h2>
          <p>Escolha o que você quer receber no seu celular.</p>
        </div>

        <form className={styles.prefsForm}>
          <label className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <strong>Novas Notas</strong>
              <span>Seja avisado assim que uma nota for lançada.</span>
            </div>
            <input type="checkbox" defaultChecked className={styles.toggleInput} />
            <span className={styles.toggleSlider}></span>
          </label>

          <label className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <strong>Alertas de Faltas</strong>
              <span>Avisos de risco de reprovação por falta.</span>
            </div>
            <input type="checkbox" defaultChecked className={styles.toggleInput} />
            <span className={styles.toggleSlider}></span>
          </label>

          <label className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <strong>Lembretes de Tarefas</strong>
              <span>Avisos de prazos de entrega chegando.</span>
            </div>
            <input type="checkbox" defaultChecked className={styles.toggleInput} />
            <span className={styles.toggleSlider}></span>
          </label>

          <label className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <strong>Avisos de Aulas</strong>
              <span>Resumo matinal de aulas e horários.</span>
            </div>
            <input type="checkbox" defaultChecked className={styles.toggleInput} />
            <span className={styles.toggleSlider}></span>
          </label>

          <button type="button" className={styles.saveBtn}>Salvar Preferências</button>
        </form>
      </section>
    </main>
  );
}
