"use client";

import { useRef } from "react";
import Image from "next/image"; // IMPORTANTE: Importação do componente otimizado
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./hero.module.css";
import { ArrowRight } from "lucide-react";

const SLIDES = [
  { id: 1, img: "/image4.png" },
  { id: 2, img: "/image5.png" },
  { id: 3, img: "/image6.png" },
  { id: 4, img: "/image2.png" },
  { id: 5, img: "/image7.png" },
  { id: 6, img: "/image8.png" },
  { id: 7, img: "/image9.png" },
];

const DATA = [...SLIDES, ...SLIDES, ...SLIDES, ...SLIDES, ...SLIDES, ...SLIDES]; 

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  
  // Refs para animação de entrada
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    // 1. ANIMAÇÃO DE ENTRADA (Igual para todos)
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (titleRef.current && subtitleRef.current && carouselContainerRef.current && buttonRef.current) {
        tl.from(titleRef.current, {
          y: 50,
          opacity: 0,
          filter: "blur(10px)",
          duration: 1,
          delay: 0.2 
        })
        .from(subtitleRef.current, {
          y: 30,
          opacity: 0,
          filter: "blur(5px)",
          duration: 0.8
        }, "-=0.6")
        .from(carouselContainerRef.current, {
          y: 100,
          opacity: 0,
          scale: 0.95,
          duration: 1.2,
          ease: "power4.out"
        }, "-=0.6")
        .from(buttonRef.current, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          clearProps: "all"
        }, "-=0.8");
    }

    // 2. LÓGICA DO CARROSSEL COM MATCHMEDIA
    mm.add({
      isDesktop: "(min-width: 769px)",
      isMobile: "(max-width: 768px)",
    }, (context) => {
      const { isMobile } = context.conditions as { isMobile: boolean };
      
      const cards = cardsRef.current.filter(Boolean);
      if (cards.length === 0) return;

      // --- AJUSTES DE DIMENSÃO ---
      // Mobile: card menor e com um pequeno gap para não colar
      const cardWidth = isMobile ? 180 : 280; 
      const gap = isMobile ? 20 : 0; 
      const spacing = cardWidth + gap; 
      const totalWidth = cards.length * spacing;

      // Mobile: Velocidade levemente ajustada
      const duration = isMobile ? 200 : 150; 

      const proxy = { x: 0 };
      
      gsap.to(proxy, {
        x: -totalWidth,
        duration: duration,
        ease: "none",
        repeat: -1
      });

      const wrapFunc = gsap.utils.wrap(0, totalWidth);

      const updateCards = () => {
        const centerX = window.innerWidth / 2;

        cards.forEach((card, i) => {
          if(!card) return;

          const rawX = (i * spacing) + proxy.x;
          const x = wrapFunc(rawX) - totalWidth / 2; 
          
          const visualX = x + (window.innerWidth / 2) + (cardWidth / 2);
          const distFromCenter = visualX - centerX;
          
          // 'val' normalizado: 0 = centro, 0.5 = metade da tela para direita, etc.
          const val = distFromCenter / window.innerWidth;

          // --- CONFIGURAÇÕES VISUAIS ---
          
          // Rotação: Suavizada no mobile para não distorcer tanto
          const rotateY = isMobile ? val * -40 : val * -85; 
          
          // Profundidade: Mobile precisa ser mais "raso"
          const depthMobile = -50 + (Math.abs(val) * 200);
          const depthDesktop = -250 + (Math.abs(val) * 1000);
          const translateZ = isMobile ? depthMobile : depthDesktop;
          
          const zIndex = Math.round(translateZ + 2000);

          card.style.transform = `
            translate3d(${x}px, -50%, 0) 
            perspective(${isMobile ? 800 : 1250}px) 
            translateZ(${translateZ}px) 
            rotateY(${rotateY}deg)
          `;
          card.style.zIndex = zIndex.toString();

          // --- LÓGICA "SOMENTE 3 CARDS" NO MOBILE ---
          if (isMobile) {
            // Se a distância normalizada for maior que 0.6 (aprox), esconde o card.
            // Isso garante que vejamos o Centro (0.0) e os vizinhos (aprox 0.4 ou 0.5)
            // e corte o resto.
            const isVisible = Math.abs(val) < 0.65;
            card.style.opacity = isVisible ? '1' : '0';
            // Opcional: transition suave para não "piscar" duro, mas no 3D as vezes o corte seco é melhor.
            card.style.transition = 'opacity 0.2s'; 
          } else {
            // DESKTOP: Sempre visível (Regra Imutável)
            card.style.opacity = '1';
            card.style.transition = 'none';
          }
        });
      };

      gsap.ticker.add(updateCards);

      return () => {
        gsap.ticker.remove(updateCards);
      };
    });

  }, { scope: containerRef });

  return (
    <section className={styles.heroSection} ref={containerRef}>
      <div className={styles.carouselGlow}></div>
      <div className={styles.content}>
        <h1 className={styles.title} ref={titleRef}>
          A embalagem que vende por você
        </h1>
        <p className={styles.subtitle} ref={subtitleRef}>
          Embale com propósito: mais presença, mais valor percebido e mais vendas.
        </p>
      </div>

      <div className={styles.carouselContainer} ref={carouselContainerRef}>

        <div className={styles.cardsWrapper}> 
          {DATA.map((item, index) => (
            <div 
              key={index}
              className={styles.card}
              ref={(el) => { if (el) cardsRef.current[index] = el }}
            >
                {/* OTIMIZAÇÃO: Usamos o componente Image do Next.js.
                   - fill: Preenche o container pai (.card) respeitando o object-fit do CSS.
                   - sizes: Define o tamanho real em cada dispositivo para baixar a imagem certa.
                   - priority: Carrega imediatamente (sem lazy load) pois está na Hero Section.
                */}
                <Image 
                  src={item.img} 
                  alt="Embalagem" 
                  fill
                  sizes="(max-width: 768px) 180px, 280px"
                  className={styles.cardImage} 
                  priority
                  quality={85}
                />
            </div>
          ))}
        </div>
      </div>

      <button className={styles.ctaButton} ref={buttonRef}>
        Faça seu orçamento <ArrowRight size={22} />
      </button>
    </section>
  );
}