// src/app/template.tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./template.module.css";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(() => {
    // Usamos gsap.context para garantir limpeza correta em React 18
    const ctx = gsap.context(() => {
      if (!containerRef.current) return;

      // --- OTIMIZAÇÃO PARA LCP ---
      // Usamos .fromTo() para garantir que o estado inicial (invisível)
      // e a animação para o final (visível) ocorram no mesmo fluxo.
      // Removemos o delay e encurtamos a duração para ser mais ágil.
      
      gsap.fromTo(containerRef.current,
        {
          // Estado Inicial (Onde começa)
          autoAlpha: 0,       // Invisível
          y: 25,              // Movimento sutil para cima (reduzido de 40)
          filter: "blur(8px)",// Blur um pouco menor (reduzido de 12)
          scale: 0.99,        // Escala quase imperceptível (reduzido de 0.98)
        },
        {
          // Estado Final (Onde termina)
          autoAlpha: 1,       // Totalmente visível
          y: 0,
          filter: "blur(0px)",
          scale: 1,
          duration: 0.5,      // Mais rápido (era 0.8s)
          ease: "power2.out", // Curva de entrada suave, mas ágil
          // delay: 0.1,      // REMOVIDO: Atrasos matam o LCP
          clearProps: "all"   // Limpa os styles inline ao terminar para evitar bugs
        }
      );

    }, containerRef); // O escopo garante que só animamos este container

    return () => ctx.revert(); // Limpa a animação se o componente desmontar
  }, { dependencies: [pathname] }); // Roda a cada mudança de rota

  return (
    <div 
      ref={containerRef} 
      id="page-transition-container"
      className={styles.transitionContainer}
      // Dica para o navegador preparar a GPU (performance)
      style={{ willChange: "transform, opacity, filter" }}
    >
      {children}
    </div>
  );
}