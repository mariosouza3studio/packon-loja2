// src/components/catalog/CatalogWrapper.tsx
"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./catalog.module.css";
import { formatPrice } from "@/utils/format";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import CustomSelect from "./CustomSelect";
import { Filter, X } from "lucide-react";

interface CatalogWrapperProps {
  initialProducts: any[];
}

export default function CatalogWrapper({ initialProducts }: CatalogWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLElement>(null);
  // Ref para controlar o debounce do preço sem causar re-renders
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- ESTADOS ---
  const [selectedType, setSelectedType] = useState<string>("Todos");
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [sortOption, setSortOption] = useState<string>("recent");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const [filteredProducts, setFilteredProducts] = useState(initialProducts);

  // --- 1. Extração Dinâmica de Tipos ---
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    initialProducts.forEach(({ node }) => {
      if (node.productType) {
        types.add(node.productType);
      }
    });
    return ["Todos", ...Array.from(types)];
  }, [initialProducts]);

  // --- 2. Cálculo do Preço Máximo Inicial ---
  const limitPrice = useMemo(() => {
    let max = 0;
    initialProducts.forEach(({ node }) => {
      const price = parseFloat(node.priceRange.minVariantPrice.amount);
      if (price > max) max = price;
    });
    return Math.ceil(max) || 100;
  }, [initialProducts]);
  
  // Seta o preço máximo apenas na montagem inicial para não travar o slider
  useEffect(() => { 
    if (maxPrice === 1000 && limitPrice !== 1000) {
        setMaxPrice(limitPrice); 
    }
  }, [limitPrice]);

  const progressPercent = limitPrice > 0 ? (maxPrice / limitPrice) * 100 : 0;

  // --- LÓGICA DE FILTRAGEM (CENTRALIZADA) ---
  const filterProducts = useCallback(() => {
    let result = initialProducts.filter(({ node }) => {
      const price = parseFloat(node.priceRange.minVariantPrice.amount);
      
      const matchesType = selectedType === "Todos" || node.productType === selectedType;
      const matchesPrice = price <= maxPrice;
      
      return matchesType && matchesPrice;
    });

    if (sortOption === "price_asc") {
      result.sort((a, b) => 
        parseFloat(a.node.priceRange.minVariantPrice.amount) - parseFloat(b.node.priceRange.minVariantPrice.amount)
      );
    } else if (sortOption === "price_desc") {
      result.sort((a, b) => 
        parseFloat(b.node.priceRange.minVariantPrice.amount) - parseFloat(a.node.priceRange.minVariantPrice.amount)
      );
    }

    // Animação de saída antes de trocar os dados
    const cards = document.querySelectorAll(`.${styles.card}`);
    
    if (cards.length > 0) {
      gsap.to(cards, {
        opacity: 0,
        y: 10,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setFilteredProducts([...result]); // Atualiza o estado
          // A animação de entrada roda automaticamente pelo useGSAP abaixo
        }
      });
    } else {
      setFilteredProducts([...result]);
    }
  }, [initialProducts, maxPrice, selectedType, sortOption]);

  // --- EFEITO REATIVO (AUTOMÁTICO) ---
  useEffect(() => {
    // Se houver um timeout pendente (usuário ainda arrastando slider), cancela
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Pequeno delay (debounce) para não animar excessivamente enquanto arrasta o preço
    timeoutRef.current = setTimeout(() => {
        filterProducts();
    }, 300); // 300ms de espera

    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [selectedType, maxPrice, sortOption, filterProducts]);


  // --- ANIMAÇÃO DE ENTRADA (Sempre que filteredProducts mudar) ---
  useGSAP(() => {
    // Garante que os elementos estejam invisíveis antes de animar entrada
    gsap.set(`.${styles.card}`, { opacity: 0, y: 30 });

    gsap.to(`.${styles.card}`, 
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.5, 
        stagger: 0.05, 
        ease: "power2.out",
        clearProps: "all" 
      }
    );
  }, { scope: containerRef, dependencies: [filteredProducts] });

  // --- ANIMAÇÃO DO MENU MOBILE ---
  useGSAP(() => {
    if (window.innerWidth <= 1024 && filterRef.current) {
      if (showMobileFilters) {
        gsap.to(filterRef.current, { 
          height: "auto", 
          opacity: 1, 
          paddingBottom: "2rem",
          duration: 0.4, 
          ease: "power2.out",
          display: "flex"
        });
      } else {
        gsap.to(filterRef.current, { 
          height: 0, 
          opacity: 0, 
          paddingBottom: 0,
          duration: 0.3, 
          ease: "power2.in",
          display: "none"
        });
      }
    }
  }, { dependencies: [showMobileFilters] });

  const sortOptions = [
    { label: "Mais recentes", value: "recent" },
    { label: "Menor preço", value: "price_asc" },
    { label: "Maior preço", value: "price_desc" }
  ];

  return (
    <div className={styles.contentWrapper} ref={containerRef}>
      
      {/* --- BOTÃO MOBILE PARA ABRIR FILTROS --- */}
      <div className={styles.mobileFilterHeader}>
        <button 
          className={styles.mobileFilterBtn} 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          {showMobileFilters ? <X size={20}/> : <Filter size={20}/>}
          <span>{showMobileFilters ? "Fechar Filtros" : "Filtrar e Ordenar"}</span>
        </button>
      </div>

      {/* --- SIDEBAR (FILTROS) --- */}
      <aside className={styles.sidebar} ref={filterRef}>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterTitle}>Ordenar por:</label>
          <CustomSelect 
            options={sortOptions} 
            value={sortOption} 
            onChange={setSortOption} 
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterTitle}>Tipos de embalagem:</label>
          <div className={styles.typesList}>
            {availableTypes.map((type) => (
              <button
                key={type}
                className={`${styles.typeButton} ${selectedType === type ? styles.typeButtonActive : ''}`}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.priceHeader}>
             <label className={styles.filterTitle}>Preço Máximo:</label>
          </div>
          
          <div className={styles.priceFilterContainer}>
             <span className={styles.priceLabelMin}>{formatPrice(maxPrice.toString())}</span>
             
             <input 
                type="range" 
                min="0" 
                max={limitPrice} 
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className={styles.rangeInput}
                style={{
                  backgroundImage: `linear-gradient(to right, #ffffff ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`
                }}
             />
          </div>
        </div>

        {/* REMOVIDO O BOTÃO "APLICAR FILTROS" DAQUI */}

      </aside>

      {/* --- GRID DE PRODUTOS --- */}
      <div className={styles.productsGrid}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map(({ node }: any) => {
             const image = node.images.edges[0]?.node;
             const price = node.priceRange.minVariantPrice;

             return (
               <Link href={`/produtos/${node.handle}`} key={node.id} className={styles.card}>
                 
                 <div className={styles.imageWrapper}>
                   {image ? (
                     <Image 
                       src={image.url} 
                       alt={image.altText || node.title}
                       fill
                       sizes="(max-width: 768px) 50vw, 33vw"
                       className={styles.productImage}
                     />
                   ) : (
                     <div style={{width:'100%', height:'100%', background:'#111', borderRadius: '20px'}}></div>
                   )}
                 </div>
                 
                 <div className={styles.info}>
                    <h3 className={styles.productTitle}>{node.title}</h3>
                    <p className={styles.productPrice}>
                      {formatPrice(price.amount, price.currencyCode)}
                    </p>
                    <button className={styles.buyButton}>
                      Ver detalhes
                    </button>
                 </div>
               </Link>
             )
          })
        ) : (
          <div className={styles.noResults}>
            <p>Nenhum produto encontrado com esses filtros.</p>
          </div>
        )}
      </div>

    </div>
  );
}