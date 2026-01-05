// src/components/catalog/CatalogWrapper.tsx
"use client";

import { useState, useMemo, useRef, useEffect, useCallback, Suspense } from "react"; // Adicionado Suspense
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation"; // IMPORTANTE
import styles from "./catalog.module.css";
import { formatPrice } from "@/utils/format";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import CustomSelect from "./CustomSelect";
import { Filter, X, Plus } from "lucide-react";
import { ShopifyProduct } from "@/lib/shopify/types";
import CatalogSkeleton from "./CatalogSkeleton";

interface CatalogWrapperProps {
  initialProducts: { node: ShopifyProduct }[];
}

const ITEMS_PER_PAGE = 12;

// Componente interno para usar useSearchParams (Necessário Suspense no Next 14)
function CatalogContent({ initialProducts }: CatalogWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLElement>(null);
  
  // LÊ OS ESTADOS INICIAIS DA URL OU USA O PADRÃO
  const initialType = searchParams.get("type") || "Todos";
  const initialSort = searchParams.get("sort") || "recent";
  // O preço máximo inicial deve ser calculado ou lido da URL
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // --- 1. MEMOIZAÇÃO DOS DADOS ESTÁTICOS ---
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    initialProducts.forEach(({ node }) => {
      if (node.productType) types.add(node.productType);
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

  // Estado local para o Slider (para performance visual instantânea)
  const [localMaxPrice, setLocalMaxPrice] = useState<number>(
    searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : limitPrice
  );
  
  // Sincroniza o slider se o limitPrice mudar (carregamento inicial)
  useEffect(() => {
      if (!searchParams.get("maxPrice") && limitPrice !== 100) {
          setLocalMaxPrice(limitPrice);
      }
  }, [limitPrice, searchParams]);


  // --- 2. FUNÇÃO PARA ATUALIZAR URL (O Coração da mudança) ---
  const updateFilters = useCallback((key: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    if (key === "type" && value === "Todos") {
      current.delete("type");
    } else {
      current.set(key, value);
    }
    
    // Reseta a paginação visual ao filtrar
    setVisibleCount(ITEMS_PER_PAGE); 
    
    // Push substitui a URL sem reload (scroll: false mantém a posição se desejar, mas em catálogo geralmente queremos voltar ao topo da lista)
    router.push(`?${current.toString()}`, { scroll: false });
  }, [searchParams, router]);


  // Debounce para o Slider de Preço (não atualizar URL a cada pixel arrastado)
  const handlePriceChange = (val: number) => {
      setLocalMaxPrice(val);
  };
  
  const commitPriceChange = () => {
      updateFilters("maxPrice", localMaxPrice.toString());
  };


  // --- 3. FILTRAGEM REATIVA AOS SEARCH PARAMS ---
  const filteredProducts = useMemo(() => {
    // Ler filtros atuais da URL (Source of Truth)
    const currentType = searchParams.get("type") || "Todos";
    const currentSort = searchParams.get("sort") || "recent";
    const currentMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : limitPrice;

    let result = initialProducts.filter(({ node }) => {
      const price = parseFloat(node.priceRange.minVariantPrice.amount);
      const matchesType = currentType === "Todos" || node.productType === currentType;
      const matchesPrice = price <= currentMaxPrice;
      return matchesType && matchesPrice;
    });

    if (currentSort === "price_asc") {
      result.sort((a, b) => 
        parseFloat(a.node.priceRange.minVariantPrice.amount) - parseFloat(b.node.priceRange.minVariantPrice.amount)
      );
    } else if (currentSort === "price_desc") {
      result.sort((a, b) => 
        parseFloat(b.node.priceRange.minVariantPrice.amount) - parseFloat(a.node.priceRange.minVariantPrice.amount)
      );
    }
    return result;
  }, [initialProducts, searchParams, limitPrice]);


  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // --- ANIMAÇÕES GSAP (Mantidas e Otimizadas) ---
  // Utilizamos useLayoutEffect ou useEffect com dependência correta
  useGSAP(() => {
    // Animação apenas se houver produtos e for uma mudança relevante
    const cards = document.querySelectorAll(`.${styles.card}`);
    if (cards.length > 0) {
        gsap.fromTo(cards, 
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out", clearProps: "all" }
        );
    }
  }, { scope: containerRef, dependencies: [visibleProducts] }); // Re-roda quando a lista visível muda


  // ... (Lógica Mobile Mantida igual ao seu código original) ...
  useGSAP(() => {
    if (window.innerWidth <= 1024 && filterRef.current) {
      if (showMobileFilters) {
        gsap.to(filterRef.current, { height: "auto", opacity: 1, paddingBottom: "2rem", duration: 0.4, display: "flex" });
      } else {
        gsap.to(filterRef.current, { height: 0, opacity: 0, paddingBottom: 0, duration: 0.3, display: "none" });
      }
    }
  }, [showMobileFilters]);

  const sortOptions = [
    { label: "Mais recentes", value: "recent" },
    { label: "Menor preço", value: "price_asc" },
    { label: "Maior preço", value: "price_desc" }
  ];

  // Recupera valores atuais para UI
  const currentTypeUI = searchParams.get("type") || "Todos";
  const currentSortUI = searchParams.get("sort") || "recent";
  const progressPercent = limitPrice > 0 ? (localMaxPrice / limitPrice) * 100 : 0;

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
            value={currentSortUI} 
            onChange={(val) => updateFilters("sort", val)} 
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterTitle}>Tipos de embalagem:</label>
          <div className={styles.typesList}>
            {availableTypes.map((type) => (
              <button
                key={type}
                className={`${styles.typeButton} ${currentTypeUI === type ? styles.typeButtonActive : ''}`}
                onClick={() => updateFilters("type", type)}
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
              <span className={styles.priceLabelMin}>{formatPrice(localMaxPrice.toString())}</span>
              
              <input 
                type="range" 
                min="0" 
                max={limitPrice} 
                value={localMaxPrice}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                onMouseUp={commitPriceChange} // Atualiza URL só ao soltar
                onTouchEnd={commitPriceChange} // Mobile
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
              visibleProducts.map(({ node }: { node: ShopifyProduct }) => {
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
              <button onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)} className={styles.loadMoreButton}>
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

// Wrapper Principal com Suspense (Obrigatório para build production no Next 14 usando useSearchParams)
export default function CatalogWrapper(props: CatalogWrapperProps) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogContent {...props} />
    </Suspense>
  );
}