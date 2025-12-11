"use client";

import { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./catalog.module.css";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export default function CustomSelect({ options, value, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find(opt => opt.value === value)?.label || "Selecione";

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (newValue: string) => {
    // Se clicar no que já está selecionado, só fecha
    if (newValue === value) {
        setIsOpen(false);
        return;
    }
    onChange(newValue);
    setIsOpen(false);
  };

  useGSAP(() => {
    if (!boxRef.current || !listRef.current || !arrowRef.current) return;

    if (isOpen) {
      // --- ABRIR ---
      // 1. A caixa cresce para a altura "auto" (calculamos a altura do conteúdo)
      // Usamos 'auto' no GSAP para ele calcular sozinho
      gsap.to(boxRef.current, {
        height: "auto",
        borderRadius: "20px", // Reduz levemente o arredondamento ao abrir se quiser, ou mantém
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)", // Sombra surge
        duration: 0.5,
        ease: "power3.out" // Curva suave igual do Header
      });

      // 2. A lista aparece suavemente
      gsap.to(listRef.current, {
        opacity: 1,
        duration: 0.3,
        delay: 0.1 // Pequeno delay para a caixa começar a abrir antes
      });

      // 3. A seta gira
      gsap.to(arrowRef.current, {
        rotation: 180,
        duration: 0.4
      });

    } else {
      // --- FECHAR ---
      // 1. Volta para altura do botão (50px)
      gsap.to(boxRef.current, {
        height: "50px",
        borderRadius: "25px", // Volta a ser pílula perfeita
        boxShadow: "0 0 0 rgba(0,0,0,0)",
        duration: 0.4,
        ease: "power3.inOut"
      });

      // 2. Lista some
      gsap.to(listRef.current, {
        opacity: 0,
        duration: 0.2
      });

      // 3. Seta volta
      gsap.to(arrowRef.current, {
        rotation: 0,
        duration: 0.4
      });
    }
  }, { scope: containerRef, dependencies: [isOpen] });

  return (
    <div className={styles.customSelectPlaceholder} ref={containerRef}>
      
      {/* O elemento que expande visualmente */}
      <div className={styles.expandingBox} ref={boxRef}>
        
        {/* O Cabeçalho (Sempre visível) */}
        <button className={styles.selectTrigger} onClick={toggleDropdown}>
          <span>{selectedLabel}</span>
          <div ref={arrowRef} style={{ display: 'flex' }}>
             <ChevronDown size={20} />
          </div>
        </button>

        {/* A Lista (Expandida) */}
        <div className={styles.optionsList} ref={listRef}>
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.optionItem} ${value === opt.value ? styles.optionSelected : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
              {/* Opcional: Check icon se estiver selecionado */}
              {value === opt.value && <div style={{width: 6, height: 6, background: 'black', borderRadius: '50%'}}/>}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}