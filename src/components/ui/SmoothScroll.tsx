// src/components/ui/SmoothScroll.tsx
"use client";

import { useEffect, useState, createContext, useContext } from "react";
import Lenis from "lenis";

// 1. Criamos um Contexto para o Lenis
const LenisContext = createContext<Lenis | null>(null);

// 2. Hook para usar o Lenis em qualquer lugar
export const useLenis = () => useContext(LenisContext);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      // Importante: garante que o scroll programático dispare eventos
      infinite: false, 
    });

    setLenisInstance(lenis);

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisInstance}>
      {children}
    </LenisContext.Provider>
  );
}