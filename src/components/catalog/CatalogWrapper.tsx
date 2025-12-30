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
import { Filter, X, Plus } from "lucide-react";

interface CatalogWrapperProps {
  initialProducts: any[];
}

const ITEMS_PER_PAGE = 12;

export default function CatalogWrapper({ initialProducts }: CatalogWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- ESTADOS ---
  const [selectedType, setSelectedType] = useState<string>("Todos");
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [sortOption, setSortOption] = useState<string>("recent");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  

  const [filteredProducts, setFilteredProducts] = useState(initialProducts);

  // NOVO: Estado para controlar quantos produtos aparecem na tela
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);


  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    initialProducts.forEach(({ node }) => {
      if (node.productType) {
        types.add(node.productType);
      }
    });
    return ["Todos", ...Array.from(types)];
  }, [initialProducts]);


  const limitPrice = useMemo(() => {
    let max = 0;
    initialProducts.forEach(({ node }) => {
      const price = parseFloat(node.priceRange.minVariantPrice.amount);
      if (price > max) max = price;
    });
    return Math.ceil(max) || 100;
  }, [initialProducts]);
  
  useEffect(() => { 
    if (maxPrice === 1000 && limitPrice !== 1000) {
        setMaxPrice(limitPrice); 
    }
  }, [limitPrice]);

  const progressPercent = limitPrice > 0 ? (maxPrice / limitPrice) * 100 : 0;

  // --- LÓGICA DE FILTRAGEM ---
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
          setFilteredProducts([...result]);
          setVisibleCount(ITEMS_PER_PAGE);
        }
      });
    } else {
      setFilteredProducts([...result]);
      setVisibleCount(ITEMS_PER_PAGE);
    }
  }, [initialProducts, maxPrice, selectedType, sortOption]);

  // --- EFEITO REATIVO ---
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
        filterProducts();
    }, 300);

    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [selectedType, maxPrice, sortOption, filterProducts]);



  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);


  // --- ANIMAÇÃO DE ENTRADA ---
  useGSAP(() => {
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
  }, { scope: containerRef, dependencies: [visibleProducts] });

  // --- FUNÇÃO VER MAIS ---
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  // Animação Mobile
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
      
      <div className={styles.mobileFilterHeader}>
        <button 
          className={styles.mobileFilterBtn} 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          {showMobileFilters ? <X size={20}/> : <Filter size={20}/>}
          <span>{showMobileFilters ? "Fechar Filtros" : "Filtrar e Ordenar"}</span>
        </button>
      </div>

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
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className={styles.mainContent}> 
          
          <div className={styles.productsGrid}>
            {visibleProducts.length > 0 ? (
              visibleProducts.map(({ node }: any) => {
                  const image = node.images.edges[0]?.node;
                  const firstVariant = node.variants?.edges[0]?.node;
                  const price = firstVariant?.price || node.priceRange.minVariantPrice;

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
          {visibleCount < filteredProducts.length && (
            <div className={styles.loadMoreContainer}>
              <button onClick={handleLoadMore} className={styles.loadMoreButton}>
                 <Plus size={20} />
                 Ver mais produtos
              </button>
              <p className={styles.loadMoreText}>
                  Exibindo {visibleProducts.length} de {filteredProducts.length} produtos
              </p>
            </div>
          )}
          
      </div>

    </div>
  );
}