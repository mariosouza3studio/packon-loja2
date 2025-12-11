"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}

export function ScrollReveal({ 
  children, 
  className = "", 
  stagger = 0.1,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const elements = gsap.utils.toArray(containerRef.current.children) as HTMLElement[];

    // --- CONFIGURAÇÃO "POP & FADE" ---
    const hiddenState = {
      autoAlpha: 0,
      scale: 0.85,    // Começa 15% menor
      y: 30,          // Leve deslocamento para baixo
      filter: "blur(5px)" // Blur suave para ajudar na transição
    };

    // Estado inicial
    gsap.set(elements, hiddenState);

    ScrollTrigger.batch(elements, {
      start: "top 85%", // Entra quando topo está a 85% da tela
      end: "bottom 15%", // Sai quando fundo está a 15% do topo (quase saindo)
      
      // 1. ENTRADA (Scroll Down) - Cresce e Aparece
      onEnter: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          stagger: stagger,
          duration: 0.8,
          ease: "back.out(1.5)", // Um "pop" elástico suave
          overwrite: true
        });
      },
      
      // 2. SAÍDA POR CIMA (Scroll Down contínuo) - Encolhe e Some
      onLeave: (batch) => {
        gsap.to(batch, {
          autoAlpha: 0,
          scale: 0.9, // Diminui um pouco ao sair
          y: -30,     // Sobe um pouco
          filter: "blur(5px)",
          stagger: stagger,
          duration: 0.6,
          ease: "power2.in",
          overwrite: true
        });
      },
      
      // 3. RE-ENTRADA (Scroll Up) - Cresce de novo
      onEnterBack: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          stagger: stagger,
          duration: 0.8,
          ease: "back.out(1.5)",
          overwrite: true
        });
      },
      
      // 4. SAÍDA POR BAIXO (Scroll Up contínuo) - Encolhe e Some
      onLeaveBack: (batch) => {
        gsap.to(batch, {
          ...hiddenState, // Volta ao estado inicial (menor e borrado)
          duration: 0.6,
          ease: "power2.in",
          overwrite: true
        });
      }
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}