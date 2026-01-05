"use client";

import styles from "./cta.module.css";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ArrowRight } from "lucide-react";
import { getWhatsAppLink } from "@/config/site";

// --- CONFIGURAÇÃO WHATSAPP ---
const WHATSAPP_NUMBER = "5535999521044"; 
const WHATSAPP_MSG = encodeURIComponent("Olá! Vim pelo site da Packon e gostaria tirar uma dúvida.");
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

export default function CTA() {
  return (
    <section className={styles.section} id="contato">
      <div className={styles.glow}></div>

      <ScrollReveal className={styles.container} stagger={0.2}>
        
        <h2 className={styles.title}>
          A embalagem ideal começa com uma boa conversa.
        </h2>
        
        {/* MUDANÇA AQUI: Link para WhatsApp com estilo de botão */}
        <a 
    href={getWhatsAppLink()} // Usa padrão
    target="_blank"
    rel="noopener noreferrer"
    className={styles.button}
    style={{ textDecoration: 'none' }}
>
  Faça seu orçamento <ArrowRight size={22} />
</a>

      </ScrollReveal>
    </section>
  );
}