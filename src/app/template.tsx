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
    window.scrollTo(0, 0);
    if (containerRef.current) {
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
        clearProps: "all"
      });
    }
  }, { scope: containerRef, dependencies: [pathname] });

  return (
    <div 
      ref={containerRef} 
      id="page-transition-container"
      className={styles.transitionContainer}
    >
      {children}
    </div>
  );
}