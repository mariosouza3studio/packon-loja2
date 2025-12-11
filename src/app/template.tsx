// src/app/template.tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./template.module.css";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(() => {
    // Garante scroll no topo
    window.scrollTo(0, 0);

    // ANIMAÇÃO DE ENTRADA (MANTIDA)
    if (containerRef.current) {
      // Forçamos o estado inicial "invisível" imediatamente para não piscar
      gsap.set(containerRef.current, {
        autoAlpha: 0,
        y: 40,
        filter: "blur(12px)",
        scale: 0.98,
      });

      gsap.to(containerRef.current, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.1,
        clearProps: "all" // Importante: limpa para não atrapalhar interações futuras
      });
    }
  }, { scope: containerRef, dependencies: [pathname] }); // Roda sempre que a rota mudar

  return (
    <div 
      ref={containerRef} 
      id="page-transition-container" // ID CRUCIAL para o TransitionLink encontrar
      className={styles.transitionContainer}
    >
      {children}
    </div>
  );
}