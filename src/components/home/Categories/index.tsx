"use client";

import { useState, useRef } from "react";
import styles from "./categories.module.css";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const CATEGORIES = [
  { id: 1, name: "Stand-up", img: "/image4.png" },
  { id: 2, name: "Pouch",  img: "/image5.png" },
  { id: 3, name: "Vácuo",  img: "/image6.png" },
  { id: 4, name: "Laminada",  img: "/image7.png" },
  { id: 5, name: "Sustentável",  img: "/image8.png" },
  { id: 6, name: "Flow Pack",  img: "/image9.png" },
];

export default function Categories() {
  const [activeId, setActiveId] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const panelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const textsRef = useRef<(HTMLHeadingElement | null)[]>([]);

  const { contextSafe } = useGSAP({ scope: containerRef }, []);

  // --- CONFIGURAÇÃO INICIAL (Responsiva) ---
  useGSAP(() => {
    const mm = gsap.matchMedia();

    // Lógica Desktop (> 900px)
    mm.add("(min-width: 901px)", () => {
      CATEGORIES.forEach((cat, idx) => {
        const isActive = cat.id === activeId;
        const panel = panelsRef.current[idx];
        const text = textsRef.current[idx];

        if (panel && text) {
          gsap.set(panel, { 
            flexGrow: isActive ? 4 : 1, 
            height: "100%" // Reseta altura se vier do mobile
          });
          gsap.set(text, {
            top: isActive ? "15%" : "50%",
            rotate: isActive ? 0 : -90,
            color: isActive ? "#ffffff" : "#fff"
          });
        }
      });
    });

    // Lógica Mobile (<= 900px)
    mm.add("(max-width: 900px)", () => {
      CATEGORIES.forEach((cat, idx) => {
        const isActive = cat.id === activeId;
        const panel = panelsRef.current[idx];
        const text = textsRef.current[idx];

        if (panel && text) {
          gsap.set(panel, { 
            flexGrow: 0, // Desativa flexGrow
            height: isActive ? 400 : 80 // Altura em pixels
          });
          gsap.set(text, {
            top: isActive ? "15%" : "50%",
            rotate: 0, // Texto sempre horizontal no mobile
            color: isActive ? "#ffffff" : "#fff"
          });
        }
      });
    });

  }, { scope: containerRef }); // Roda na montagem e resize

  // --- CLICK HANDLER (Responsivo) ---
  const handleClick = contextSafe((id: number) => {
    if (id === activeId) return;
    setActiveId(id);

    // Detecta se é mobile no momento do clique
    const isMobile = window.matchMedia("(max-width: 900px)").matches;

    CATEGORIES.forEach((cat, idx) => {
      const isActive = cat.id === id;
      const panel = panelsRef.current[idx];
      const text = textsRef.current[idx];

      if (!panel || !text) return;

      if (isMobile) {
        // --- ANIMAÇÃO MOBILE (Altura) ---
        gsap.to(panel, {
          height: isActive ? 400 : 80, // Expande altura
          duration: 0.6,
          ease: "power3.inOut",
          overwrite: "auto"
        });

        gsap.to(text, {
          top: isActive ? "15%" : "50%",
          rotate: 0, // Sempre reto
          color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
          duration: 0.6,
          overwrite: "auto"
        });

      } else {
        // --- ANIMAÇÃO DESKTOP (FlexGrow) ---
        gsap.to(panel, {
          flexGrow: isActive ? 4 : 1,
          height: "100%", // Garante altura total
          duration: 0.8,
          ease: "power3.inOut",
          overwrite: "auto"
        });

        gsap.to(text, {
          top: isActive ? "15%" : "50%",
          rotate: isActive ? 0 : -90,
          color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
          duration: 0.8,
          overwrite: "auto"
        });
      }
    });
  });

  return (
    <section className={styles.section} ref={containerRef}>
      
      <ScrollReveal className={styles.header}>
        <h2 className={styles.title}>Categorias</h2>
      </ScrollReveal>

      <ScrollReveal className={styles.container} stagger={0.1}>
        {CATEGORIES.map((cat, index) => (
          <div
            key={cat.id}
            className={styles.panel} 
            ref={(el) => { if (el) panelsRef.current[index] = el }}
            onClick={() => handleClick(cat.id)}
          >
            <div className={styles.imageWrapper}>
               <img src={cat.img} alt={cat.name} className={styles.bgImage} />
               <div className={styles.overlay}></div>
            </div>

            <h3 
              className={styles.floatingLabel}
              ref={(el) => { if (el) textsRef.current[index] = el }}
            >
              {cat.name}
            </h3>
            
          </div>
        ))}
      </ScrollReveal>
    </section>
  );
}