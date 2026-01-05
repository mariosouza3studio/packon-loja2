// src/app/not-found.tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import { SearchX, Home } from "lucide-react";
import styles from "./errors.module.css";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function NotFound() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!contentRef.current) return;

    // Animação de entrada suave
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
        <div className={styles.iconWrapper}>
          <SearchX size={32} />
        </div>
        
        <h1 className={styles.title}>Página não encontrada</h1>
        
        <p className={styles.description}>
          O link que você acessou pode estar quebrado ou a página foi removida.
          Confira nosso catálogo ou volte para o início.
        </p>
        
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            <Home size={18} />
            Voltar ao Início
          </Link>
          
          <Link href="/produtos" className={styles.secondaryBtn}>
            Ver Catálogo
          </Link>
        </div>
      </div>
    </main>
  );
}