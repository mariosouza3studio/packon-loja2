// src/components/product/ProductView/index.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Loader2, Check, ShoppingBag, ArrowRight } from "lucide-react"; 
import styles from "./productView.module.css";
import { formatPrice } from "@/utils/format";
import { useCartStore } from "@/store/cartStore";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import OptionSelector from "./OptionSelector";
import { useProductVariant } from "@/hooks/useProductVariant";
import { useShipping } from "@/hooks/useShipping";
import { toast } from "sonner";
import { ShopifyProduct } from "@/lib/shopify/types";

interface ProductViewProps {
  product: ShopifyProduct;
}

export default function ProductView({ product }: ProductViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  
  // ⚡ LCP OPTIMIZATION: Ref para rastrear se é a primeira carga da página
  const isFirstLoad = useRef(true);

  // Hooks de Lógica
  const { 
    currentVariant, 
    selectedOptions, 
    handleOptionChange, 
    isOptionValid 
  } = useProductVariant(product);

  const { 
    cep, 
    handleCepChange, 
    calculate: calculateShipping, 
    loading: cepLoading, 
    options: shippingOptions 
  } = useShipping();

  const { addItem, openCart } = useCartStore();

  const [selectedImage, setSelectedImage] = useState(product.images.edges[0]?.node.url || "");
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  const [isAdding, setIsAdding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  const { contextSafe } = useGSAP({ scope: containerRef });

  // --- LÓGICA DE TROCA DE IMAGEM ---
  
  const requestImageChange = contextSafe((newUrl: string) => {
    if (newUrl === selectedImage) return;

    // Se não é a primeira carga, ativamos o loader e a animação de saída
    setIsImageLoading(true);
    
    if (mainImageRef.current) {
        gsap.to(mainImageRef.current, {
            opacity: 0,
            scale: 0.96,
            duration: 0.2,
            ease: "power1.out",
            onComplete: () => {
                setSelectedImage(newUrl);
            }
        });
    } else {
        setSelectedImage(newUrl);
    }
  });

  const handleImageLoadComplete = contextSafe(() => {
    setIsImageLoading(false); 
    
    // ⚡ LCP OPTIMIZATION: Se for a primeira carga, NÃO anima.
    // O navegador pinta a imagem instantaneamente.
    if (isFirstLoad.current) {
        isFirstLoad.current = false;
        // Garante que a imagem esteja visível e no tamanho certo (caso o CSS tenha falhado)
        if (mainImageRef.current) {
            gsap.set(mainImageRef.current, { opacity: 1, scale: 1 });
        }
        return; 
    }

    // Se NÃO for a primeira carga (o usuário clicou numa thumb), faz a animação bonita.
    if (mainImageRef.current) {
        gsap.fromTo(mainImageRef.current, 
            { opacity: 0, scale: 0.96 },
            { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }
        );
    }
  });

  useEffect(() => {
    const variantImage = currentVariant?.image?.url;
    if (variantImage && variantImage !== selectedImage) {
        requestImageChange(variantImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVariant]);


  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isImageLoading) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: "scale(2)" });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ transformOrigin: "center center", transform: "scale(1)" });
  };

  const handleAddToCart = async () => {
    if (!currentVariant || !currentVariant.availableForSale || isAdding) return;
    setIsAdding(true);
    try {
        await addItem(currentVariant.id, 1);
        setIsAdding(false);
        setIsSuccess(true);
        toast.success(`${product.title} adicionado!`, {
            style: { background: '#101010', color: '#fff', border: '1px solid #333' }
        });
        setTimeout(() => {
          setIsSuccess(false);
          openCart(); 
        }, 800);
    } catch (error) {
        setIsAdding(false);
        toast.error("Erro ao adicionar ao carrinho.");
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVariant) {
        toast.warning("Selecione as opções do produto primeiro.");
        return;
    }
    const price = parseFloat(currentVariant.price.amount);
    calculateShipping(price);
  };

  if (!product) return null;
  
  const isAvailable = currentVariant?.availableForSale ?? false;
  const currentPrice = currentVariant?.price 
    ? formatPrice(currentVariant.price.amount, currentVariant.price.currencyCode)
    : formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode);

  return (
    <section className={styles.container} ref={containerRef}>
      
      <div className={styles.topSection}>
        
        {/* --- ESQUERDA: IMAGEM --- */}
        <div className={styles.imageContainer}>
            <div 
                className={styles.mainImageWrapper}
                ref={imageWrapperRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
              {isImageLoading && (
                  <div style={{
                      position: 'absolute', top: '50%', left: '50%', 
                      transform: 'translate(-50%, -50%)', zIndex: 5
                  }}>
                      <Loader2 className={styles.spin} size={40} color="#FFDA45" />
                  </div>
              )}

              <Image 
                ref={mainImageRef}
                src={selectedImage} 
                alt={product.title} 
                fill 
                priority // Mantém prioridade máxima
                quality={90} // ⚡ Qualidade Premium para Embalagens
                className={styles.mainImage}
                style={zoomStyle}
                // ⚡ LCP OPTIMIZATION: Sizes calculados matematicamente
                // Mobile (até 768px): Ocupa quase 100% da tela (tirando paddings) = 95vw
                // Tablet (até 1200px): Ocupa metade da tela = 50vw
                // Desktop (> 1200px): O container trava em 650px fixos. Não precisa baixar imagem 4K.
                sizes="(max-width: 768px) 95vw, (max-width: 1200px) 50vw, 650px"
                onLoad={handleImageLoadComplete}
              />
            </div>

            <div className={styles.thumbnailsRow}>
              {product.images.edges.map(({ node }, idx) => (
                <div 
                  key={node.url || idx} 
                  className={`${styles.thumbBox} ${selectedImage === node.url ? styles.thumbActive : ''}`}
                  onClick={() => requestImageChange(node.url)}
                  role="button"
                  tabIndex={0}
                >
                  <Image 
                    src={node.url} 
                    alt={`Ver imagem ${idx + 1}`} 
                    fill 
                    className={styles.thumbImg} 
                    // Thumbs são pequenas, não precisam de muita resolução
                    sizes="80px" 
                    quality={60}
                  />
                </div>
              ))}
            </div>
        </div>

        {/* --- DIREITA: INFOS --- */}
        <div className={styles.infoContainer}>
            
            <h1 className={styles.title}>{product.title}</h1>
            
            <div className={styles.priceWrapper}>
                <span className={styles.priceValue}>{currentPrice}</span>
            </div>

            <div className={styles.controlsRow}>
                {product.options.map((option) => (
                    option.name !== "Title" && (
                        <OptionSelector 
                           key={option.id || option.name}
                           label={option.name}
                           options={option.values}
                           selected={selectedOptions[option.name] || ""}
                           onChange={(newValue) => handleOptionChange(option.name, newValue)}
                           isOptionValid={isOptionValid}
                        />
                    )
                ))}
            </div>

            <button 
                className={`
                  ${styles.addToCartBtn} 
                  ${isSuccess ? styles.btnSuccess : ''}
                `}
                onClick={handleAddToCart}
                disabled={!isAvailable || isAdding || isSuccess}
            >
                {isAdding ? (
                   <><Loader2 className={styles.spin} size={24}/><span>Adicionando...</span></>
                ) : isSuccess ? (
                   <><Check size={26} /><span>Adicionado!</span></>
                ) : !isAvailable ? (
                   <span>Indisponível</span>
                ) : (
                   <><span style={{ marginRight: '0.5rem' }}>Adicionar ao carrinho</span><ShoppingBag size={24} /></>
                )}
            </button>

            {/* FRETE */}
            <div className={styles.shippingSection}>
                <div className={styles.shippingHeader}>
                    <span className={styles.sectionLabel}>Calcular Frete e Prazo</span>
                </div>
                
                <form onSubmit={handleShippingSubmit} className={styles.shippingForm}>
                    <input 
                        type="text" 
                        placeholder="00000-000" 
                        className={styles.shippingInput}
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        maxLength={9}
                    />
                    <button type="submit" className={styles.shippingBtn} disabled={cepLoading}>
                        {cepLoading ? <Loader2 className={styles.spin} size={18}/> : <ArrowRight size={18} />}
                    </button>
                </form>
                
                {shippingOptions && (
                   <div className={styles.shippingResultsList}>
                      {shippingOptions.map((opt, idx) => (
                          <div key={idx} className={styles.shippingOption}>
                             <div className={styles.shippingInfo}>
                                <span className={styles.shippingName}>{opt.name}</span>
                                <span className={styles.shippingDays}>
                                   {opt.days === 1 ? '1 dia útil' : `${opt.days} dias úteis`}
                                </span>
                             </div>
                             <div className={styles.shippingPrice}>
                                {formatPrice(opt.price.toString())}
                             </div>
                          </div>
                      ))}
                   </div>
                )}
            </div>

        </div>
      </div>

      <ScrollReveal>
        <div className={styles.specsContainer}>
            <h2 className={styles.specsTitle}>Detalhes técnicos</h2>
            <div 
                className={styles.specsContent}
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} 
            />
        </div>
      </ScrollReveal>

    </section>
  );
}