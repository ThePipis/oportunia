import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Logo ficticio - círculo con icono radar */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◎</span>
        </div>

        <h1 className={styles.title}>OportunIA</h1>

        <p className={styles.subtitle}>
          Radar de clientes de alto valor para vendedores de servicios de AI
        </p>

        <p className={styles.tagline}>
          Tu próximo cliente, con probabilidad real de cerrar.
        </p>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎯</div>
            <div className={styles.featureTitle}>Encuentra</div>
            <div className={styles.featureDesc}>
              Negocios reales en tu zona con data pública verificada
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <div className={styles.featureTitle}>Califica</div>
            <div className={styles.featureDesc}>
              Score 5D que predice probabilidad real de cierre
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🚀</div>
            <div className={styles.featureTitle}>Propón</div>
            <div className={styles.featureDesc}>
              Generador de propuestas listo para presentar
            </div>
          </div>
        </div>

        <div className={styles.version}>v0.1.0 · Cargando configuración inicial...</div>
      </div>
    </main>
  );
}
