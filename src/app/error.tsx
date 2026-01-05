// src/app/error.tsx
"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, RefreshCw, MessageCircle } from "lucide-react";
import styles from "./errors.module.css";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { getWhatsAppLink, SITE_CONFIG } from "@/config/site";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Log do erro para monitoramento (Sentry, LogRocket, ou console)
    console.error("⚠️ Erro Crítico Packon:", error);
  }, [error]);

  useGSAP(() => {
    if (!contentRef.current) return;
    
    gsap.fromTo(contentRef.current.children, 
      { y: 30, autoAlpha: 0 },
      { 
        y: 0, 
        autoAlpha: 1, 
        duration: 0.8, 
        stagger: 0.1, 
        ease: "power3.out" 
      }
    );
  }, { scope: containerRef });

  return (
    <main className={styles.container} ref={containerRef}>
      <div className={styles.glow}></div>

      <div className={styles.content} ref={contentRef}>
        <div className={styles.iconWrapper} style={{ borderColor: '#ff5555', background: 'rgba(255, 85, 85, 0.1)' }}>
          <AlertTriangle size={32} color="#ff5555" />
        </div>

        <h2 className={styles.title}>Algo deu errado</h2>
        
        <p className={styles.description}>
          Não foi possível carregar as informações agora. 
          Nossa equipe técnica já foi notificada.
          <br /><br />
          <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Código do erro: {error.digest || "Unknown"}</span>
        </p>

        <div className={styles.actions}>
          {/* Botão de Tentar Novamente (Recarrega a rota sem refresh total) */}
          <button onClick={() => reset()} className={styles.primaryBtn}>
            <RefreshCw size={18} />
            Tentar Novamente
          </button>
          
          {/* Botão de Suporte */}
          <a 
  href={getWhatsAppLink("Olá! Estou vendo uma tela de erro no site e preciso de ajuda.")} 
  target="_blank" 
  rel="noopener noreferrer"
  className={styles.secondaryBtn}
  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
>
  <MessageCircle size={18} />
  Falar com Suporte
</a>
        </div>
      </div>
    </main>
  );
}