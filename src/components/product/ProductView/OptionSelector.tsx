// src/components/product/productView/OptionSelector.tsx
"use client";

import { useState, useRef, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./productView.module.css";

interface OptionSelectorProps {
  label: string;
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  isOptionValid: (optionName: string, value: string) => boolean;
}

export default function OptionSelector({ 
  label, 
  options, 
  selected, 
  onChange,
  isOptionValid 
}: OptionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  // --- LÓGICA DE ORDENAÇÃO INTELIGENTE (Natural Sort) ---
  // Isso garante que "100 unidades" venha depois de "50 unidades"
  // e não antes (ordem alfabética vs numérica).
  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => {
      // Tenta extrair números das strings (ex: "100 un" -> 100)
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;

      // Se ambos tiverem números, ordena pelo valor numérico
      if (numA > 0 && numB > 0) {
        if (numA !== numB) return numA - numB;
      }
      
      // Fallback para ordem alfabética se não forem números
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [options]);

  // Animação de Abertura/Fechamento
  useGSAP(() => {
    if (!listRef.current || !iconRef.current) return;

    if (isOpen) {
      gsap.to(listRef.current, {
        height: "auto",
        autoAlpha: 1,
        duration: 0.4,
        ease: "power3.out"
      });
      gsap.to(iconRef.current, { rotation: 180, duration: 0.3 });
      
      // Ajuste de z-index para garantir que fique por cima
      if(containerRef.current) containerRef.current.style.zIndex = "50";

    } else {
      gsap.to(listRef.current, {
        height: 0,
        autoAlpha: 0,
        duration: 0.3,
        ease: "power3.in",
        onComplete: () => {
             // Retorna z-index ao normal após fechar
             if(containerRef.current) containerRef.current.style.zIndex = "10";
        }
      });
      gsap.to(iconRef.current, { rotation: 0, duration: 0.3 });
    }
  }, { scope: containerRef, dependencies: [isOpen] });

  return (
    <div 
      className={`${styles.selectorContainer} ${isOpen ? styles.selectorContainerOpen : ''}`} 
      ref={containerRef}
    >
      
      {/* Cabeçalho */}
      <button 
        className={`${styles.selectorHeader} ${isOpen ? styles.selectorHeaderActive : ''}`} 
        onClick={toggleOpen}
      >
        <div className={styles.selectorLabelInfo}>
          <span className={styles.selectorLabelTitle}>{label}</span>
          <span className={styles.selectorCurrentValue}>{selected}</span>
        </div>
        <div ref={iconRef} className={styles.iconWrapper}>
          <ChevronDown size={20} color="#FFDA45" />
        </div>
      </button>

      {/* Lista Dropdown */}
      <div className={styles.selectorListWrapper} ref={listRef}>
        <div className={styles.selectorGrid}>
          {sortedOptions.map((value) => { 
            const isValid = isOptionValid(label, value);
            const isSelected = selected === value;

            // --- LÓGICA DE FILTRO ---
            // Se a opção NÃO for válida e NÃO for a selecionada, ela desaparece.
            // Retornamos null para não renderizar nada no DOM.
            if (!isValid && !isSelected) {
                return null;
            }

            return (
              <button
                key={value}
                onClick={() => {
                  onChange(value);
                  setIsOpen(false);
                }}
                className={`
                  ${styles.optionItem} 
                  ${isSelected ? styles.optionSelected : ''}
                `}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}