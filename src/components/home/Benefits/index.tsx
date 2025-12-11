"use client";

import styles from "./benefits.module.css";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

// --- NOVOS ÍCONES GEOMÉTRICOS (Clean & Modern) ---

const IconDelivery = () => (
  <svg width="74" height="74" viewBox="0 0 24 24" fill="none" stroke="#FFDA45" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    {/* Cabine e Carga unificadas para fluidez */}
    <path d="M14 5h-9a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2v-6l-3 -3h-4z" />
    {/* Rodas */}
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    {/* Linhas de vento (separadas para não confundir) */}
    <path d="M2 9h-2" />
    <path d="M4 6h-4" />
    <path d="M2 12h-2" />
  </svg>
);

const IconPayment = () => (
  <svg width="74" height="74" viewBox="0 0 24 24" fill="none" stroke="#FFDA45" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    {/* Cartão Frontal (Obrigatório ter o Chip para parecer cartão) */}
    <rect x="2" y="5" width="20" height="14" rx="2" />
    {/* Faixa Magnética */}
    <line x1="2" y1="10" x2="22" y2="10" />
    {/* Chip do Cartão */}
    <path d="M6 14h2v2h-2z" fill="#FFDA45" stroke="none" />
    <path d="M6 14h2v2h-2z" stroke="#FFDA45" />
  </svg>
);

const IconSecurity = () => (
  <svg width="74" height="74" viewBox="0 0 24 24" fill="none" stroke="#FFDA45" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    {/* Corpo do Cadeado */}
    <rect x="5" y="11" width="14" height="10" rx="2" />
    {/* Haste (Arco) Perfeito */}
    <circle cx="12" cy="16" r="1" />
    <path d="M8 11v-4a4 4 0 0 1 8 0v4" />
  </svg>
);

// --- DADOS ---

const BENEFITS = [
  {
    id: 1,
    icon: <IconDelivery />,
    title: "Entrega em todo o Brasil",
    desc: "Receba seus produtos onde estiver, com entrega rápida e segura."
  },
  {
    id: 2,
    icon: <IconPayment />,
    title: "Pagamento facilitado",
    desc: "Escolha entre diversas formas de pagamento e finalize seu pedido com facilidade."
  },
  {
    id: 3,
    icon: <IconSecurity />,
    title: "Compre com segurança",
    desc: "Ambiente protegido para você comprar com total tranquilidade."
  }
];

export default function Benefits() {
  return (
    <section className={styles.section}>
      
      <ScrollReveal>
        <h2 className={styles.title}>Especialistas em embalagens plásticas que impulsionam o seu negócio.</h2>
      </ScrollReveal>

      <ScrollReveal className={styles.grid} stagger={0.2}>
        {BENEFITS.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.iconWrapper}>
              {/* Círculo sutil atrás para dar peso ao ícone */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.icon}
              </div>
            </div>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            <p className={styles.cardDesc}>{item.desc}</p>
          </div>
        ))}
      </ScrollReveal>

    </section>
  );
}