import styles from "./footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Sem ScrollReveal, sem animação. Apenas o texto estático. */}
      <img src="/logo-footer.png" alt="" />
    </footer>
  );
}