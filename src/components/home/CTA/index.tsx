"use client";

import styles from "./cta.module.css";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className={styles.section}>
      <div className={styles.glow}></div>

      {/* CORREÇÃO: 
        Passamos a classe .container direto para o ScrollReveal.
        Agora a div que ele gera terá 'display: flex' e 'align-items: center',
        centralizando o H2 e o Button internamente.
      */}
      <ScrollReveal className={styles.container} stagger={0.2}>
        
        <h2 className={styles.title}>
          Vamos criar algo incrível<br />
          juntos?
        </h2>
        
        <button className={styles.button}>
          Faça seu orçamento <ArrowRight size={22} />
        </button>

      </ScrollReveal>
    </section>
  );
}