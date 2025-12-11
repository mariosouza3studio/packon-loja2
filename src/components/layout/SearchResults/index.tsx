"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useSearchStore } from "@/store/searchStore";
import styles from "./searchResults.module.css";

export default function SearchResults() {
  const { isOpen, query, results, setIsOpen } = useSearchStore();
  
  const containerRef = useRef<HTMLDivElement>(null); // O Box (Máscara)
  const innerRef = useRef<HTMLDivElement>(null);     // O Conteúdo (Padding)

  useGSAP(() => {
    if (!containerRef.current || !innerRef.current) return;

    const shouldShow = isOpen && query.length >= 2;
    
    // Configuração global da timeline para suavidade
    const tl = gsap.timeline({
      defaults: { ease: "power3.out" } // Curva mais suave e contínua (sem o freio brusco da expo)
    });

    if (shouldShow) {
      // --- ABRIR (Suave e Contínuo) ---
      
      // 1. O Box Externo apenas destrava a altura (de 0 para auto)
      tl.fromTo(containerRef.current, 
        { height: 0, autoAlpha: 0 },
        { 
          height: "auto", 
          autoAlpha: 1, 
          duration: 0.6,
          overwrite: "auto"
        }
      );

      // 2. O Conteúdo interno desliza sutilmente para o lugar
      tl.fromTo(innerRef.current,
        { y: -20, autoAlpha: 0 },
        { 
          y: 0, 
          autoAlpha: 1, 
          duration: 0.6, 
          clearProps: "transform" // Limpa transformações no final para evitar blur em textos
        },
        "<" // Começa EXATAMENTE junto com a altura (sincronia perfeita)
      );

      // 3. Os itens aparecem em cascata muito rápida
      const items = innerRef.current.querySelectorAll(`.${styles.gridItem}`);
      if (items.length > 0) {
        tl.fromTo(items,
          { y: 10, autoAlpha: 0 }, // Começam levemente descidos
          { 
            y: 0, 
            autoAlpha: 1, 
            stagger: 0.03, // Cascata bem rápida para não parecer lenta
            duration: 0.4 
          },
          "-=0.4" // Começa antes do box terminar de abrir
        );
      }

    } else {
      // --- FECHAR ---
      
      tl.to(innerRef.current, {
        autoAlpha: 0,
        y: -10,
        duration: 0.3
      });
      
      tl.to(containerRef.current, {
        height: 0,
        duration: 0.35,
        ease: "power2.inOut"
      }, "<"); // Fecha junto com o conteúdo sumindo
    }

  }, [isOpen, query, results]);

  return (
    <>
      {isOpen && (
        <div className={styles.overlayBackdrop} onClick={() => setIsOpen(false)} />
      )}

      {/* O Box Externo (A Máscara) */}
      <div className={styles.megaBox} ref={containerRef}>
        
        {/* O Wrapper Interno (Onde fica o Padding e Conteúdo) */}
        <div className={styles.innerWrapper} ref={innerRef}>
            
            {results.length > 0 ? (
              <div className={styles.gridContainer}>
                {results.map((product) => (
                  <Link 
                    key={product.id} 
                    href={`/produtos/${product.handle}`}
                    className={styles.gridItem}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className={styles.imgWrapper}>
                      {product.image ? (
                        <Image src={product.image} alt="" fill className={styles.img} />
                      ) : (
                        <div className={styles.placeholder} />
                      )}
                    </div>
                    <span className={styles.productName}>{product.title}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>Nenhum produto encontrado.</p>
              </div>
            )}
            
        </div>
      </div>
    </>
  );
}