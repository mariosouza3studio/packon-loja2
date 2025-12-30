// src/components/product/productView/index.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowRight, Loader2, Check, ShoppingBag } from "lucide-react"; 
import styles from "./productView.module.css";
import { formatPrice } from "@/utils/format";
import { useCartStore } from "@/store/cartStore";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { calculateShipping } from "@/app/actions/shipping";
import OptionSelector from "./OptionSelector";

interface ProductViewProps {
  product: any;
}

export default function ProductView({ product }: ProductViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { addItem, openCart } = useCartStore();

  // --- ESTADOS ---
  const [selectedImage, setSelectedImage] = useState(product.images.edges[0]?.node.url);
  const [isAdding, setIsAdding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Estados de Frete
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<any[] | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Estados de Variante
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentVariant, setCurrentVariant] = useState<any>(null);

  // Estados de Zoom
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  // --- 1. INICIALIZAÇÃO INTELIGENTE ---
  useEffect(() => {
    const variantIdFromUrl = searchParams.get('variant');
    let targetVariant;

    // Tenta achar variante pela URL
    if (variantIdFromUrl) {
      targetVariant = product.variants.edges.find((v: any) => v.node.id === variantIdFromUrl)?.node;
    }

    // Se não achou ou não tem URL, pega a primeira disponível
    if (!targetVariant) {
      targetVariant = product.variants.edges.find((v: any) => v.node.availableForSale)?.node 
                      || product.variants.edges[0]?.node;
    }

    if (targetVariant) {
      setCurrentVariant(targetVariant);
      const newOptions: Record<string, string> = {};
      targetVariant.selectedOptions.forEach((opt: any) => {
        newOptions[opt.name] = opt.value;
      });
      setSelectedOptions(newOptions);

      if(targetVariant.image?.url) {
        setSelectedImage(targetVariant.image.url);
      }
    }
  }, [product, searchParams]);

  // --- 2. VERIFICAÇÃO DE OPÇÕES VÁLIDAS (O CÉREBRO DO FILTRO) ---
  const isOptionValid = (optionName: string, value: string) => {
    return product.variants.edges.some(({ node }: any) => {
       // 1. A variante precisa ter o valor que estamos testando (ex: Tamanho 10x10)
       const hasValue = node.selectedOptions.some((opt: any) => opt.name === optionName && opt.value === value);
       if (!hasValue) return false;

       // 2. A variante precisa ser compatível com as OUTRAS opções selecionadas
       const isCompatible = node.selectedOptions.every((opt: any) => {
         // Ignora a própria opção que estamos testando
         if (opt.name === optionName) return true;
         
         // --- CORREÇÃO CRÍTICA ---
         // Ignoramos a "Quantidade" ao validar Tamanho ou Espessura.
         // Isso impede que uma quantidade selecionada (ex: 100) esconda tamanhos
         // que só existem em quantidades maiores (ex: 1000).
         if (opt.name === "Quantidade") return true; 

         // Para as outras opções (Tamanho vs Espessura), a compatibilidade é rigorosa
         return selectedOptions[opt.name] === opt.value;
       });

       // Só retorna true se for compatível E estiver disponível para venda
       return isCompatible && node.availableForSale;
    });
  };

  // --- 3. ANIMAÇÕES ---
  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleImageChangeAnim = contextSafe((newUrl: string) => {
    if (newUrl === selectedImage) return;
    
    gsap.to(mainImageRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      onComplete: () => {
        setSelectedImage(newUrl);
        gsap.to(mainImageRef.current, { opacity: 1, scale: 1, duration: 0.3 });
      }
    });
  });

  // --- 4. ZOOM ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(2)", 
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)",
    });
  };

  // --- 5. HANDLERS ---
  const handleOptionChange = (optionName: string, value: string) => {
    // Cria o novo estado desejado
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);

    // Tenta achar a variante exata
    const matchedVariant = product.variants.edges.find(({ node }: any) => {
      return node.selectedOptions.every((opt: any) => newOptions[opt.name] === opt.value);
    })?.node;

    if (matchedVariant) {
      // Cenário Perfeito: A variante existe
      setCurrentVariant(matchedVariant);
      if (matchedVariant.image?.url) handleImageChangeAnim(matchedVariant.image.url);
      updateUrl(matchedVariant.id);
    } else {
       // Cenário de Fallback: A combinação exata não existe (ex: mudou tamanho, mas a qtd antiga não serve)
       // Procuramos a primeira variante válida que tenha a NOVA opção selecionada
       const fallbackVariant = product.variants.edges.find(({ node }: any) => {
            // Tem que ter o novo valor (ex: o novo tamanho)
             const hasNewValue = node.selectedOptions.some((opt: any) => opt.name === optionName && opt.value === value);
             
             // Tem que ter compatibilidade parcial (ex: tentar manter a Espessura se mudou Tamanho)
             // Aqui simplificamos para pegar o primeiro disponível com o novo valor para garantir que não trave
             return hasNewValue && node.availableForSale;
        })?.node;

       if (fallbackVariant) {
          const fallbackOptions: Record<string, string> = {};
          fallbackVariant.selectedOptions.forEach((opt: any) => fallbackOptions[opt.name] = opt.value);
          
          setSelectedOptions(fallbackOptions);
          setCurrentVariant(fallbackVariant);
          if (fallbackVariant.image?.url) handleImageChangeAnim(fallbackVariant.image.url);
          updateUrl(fallbackVariant.id);
       }
    }
  };

  const updateUrl = (variantId: string) => {
     const params = new URLSearchParams(searchParams.toString());
     params.set('variant', variantId);
     router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleAddToCart = async () => {
    if (!currentVariant || !currentVariant.availableForSale || isAdding) return;
    setIsAdding(true);
    await addItem(currentVariant.id, 1);
    setIsAdding(false);
    setIsSuccess(true);
    setTimeout(() => {
        setIsSuccess(false);
        openCart(); 
    }, 800);
  };

  // --- LÓGICA DE FRETE ---
  const handleCalculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setShippingError(null);
    setShippingOptions(null);

    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length < 8) return;
    if (!currentVariant) return;
    
    setCepLoading(true);

    const price = parseFloat(currentVariant.price.amount);
    const weight = 1; 

    try {
        const result = await calculateShipping(cleanCep, [{
            quantity: 1, 
            price: price,
            weight: weight
        }]);

        if (result.error) {
            setShippingError(result.error);
        } else if (result.options && result.options.length > 0) {
            setShippingOptions(result.options.slice(0, 3));
        } else {
            setShippingError("Nenhuma opção disponível para este CEP.");
        }
    } catch (error) {
        setShippingError("Erro ao calcular frete.");
    } finally {
        setCepLoading(false);
    }
  };

  if (!product) return null;
  const isAvailable = currentVariant?.availableForSale;

  return (
    <section className={styles.container} ref={containerRef}>
      
      <div className={styles.topSection}>
        
        {/* --- CONTAINER ESQUERDA (IMAGEM) --- */}
        <div className={styles.imageContainer}>
            <div 
                className={styles.mainImageWrapper}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
              <Image 
                ref={mainImageRef}
                src={selectedImage} 
                alt={product.title} 
                fill 
                priority
                className={styles.mainImage}
                style={zoomStyle}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className={styles.thumbnailsRow}>
              {product.images.edges.map(({ node }: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`${styles.thumbBox} ${selectedImage === node.url ? styles.thumbActive : ''}`}
                  onClick={() => handleImageChangeAnim(node.url)}
                >
                  <Image src={node.url} alt="Thumb" fill className={styles.thumbImg} sizes="80px" />
                </div>
              ))}
            </div>
        </div>

        {/* --- CONTAINER DIREITA (INFOS) --- */}
        <div className={styles.infoContainer}>
            
            <h1 className={styles.title}>{product.title}</h1>
            
            <div className={styles.priceWrapper}>
                <span className={styles.priceValue}>
                {currentVariant 
                  ? formatPrice(currentVariant.price.amount, currentVariant.price.currencyCode)
                  : "..."
                }
                </span>
            </div>

            {/* --- CONTROLES (SELETORES) --- */}
            <div className={styles.controlsRow}>
                {product.options.map((option: any) => (
                    option.name !== "Title" && (
                        <OptionSelector 
                           key={option.name}
                           label={option.name}
                           options={option.values}
                           selected={selectedOptions[option.name] || ""}
                           onChange={(newValue) => handleOptionChange(option.name, newValue)}
                           isOptionValid={isOptionValid}
                        />
                    )
                ))}
            </div>

            {/* --- BOTÃO CARRINHO --- */}
            <button 
                className={`
                  ${styles.addToCartBtn} 
                  ${isSuccess ? styles.btnSuccess : ''}
                `}
                onClick={handleAddToCart}
                disabled={!isAvailable || isAdding || isSuccess}
            >
                {isAdding ? (
                   <>
                     <Loader2 className={styles.spin} size={24}/>
                     <span>Adicionando...</span>
                   </>
                ) : isSuccess ? (
                   <>
                     <Check size={26} />
                     <span>Adicionado!</span>
                   </>
                ) : !isAvailable ? (
                   <span>Indisponível</span>
                ) : (
                   <>
                     <span>Adicionar ao carrinho</span>
                     <ShoppingBag size={24} />
                   </>
                )}
            </button>

            {/* --- FRETE --- */}
            <div className={styles.shippingSection}>
                <div className={styles.shippingHeader}>
                    <span className={styles.sectionLabel}>Calcular Frete e Prazo</span>
                </div>
                
                <form onSubmit={handleCalculateShipping} className={styles.shippingForm}>
                    <input 
                        type="text" 
                        placeholder="00000-000" 
                        className={styles.shippingInput}
                        value={cep}
                        onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, '');
                            if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2');
                            setCep(v);
                        }}
                        maxLength={9}
                    />
                    <button type="submit" className={styles.shippingBtn} disabled={cepLoading}>
                        {cepLoading ? <Loader2 className={styles.spin} size={18}/> : <ArrowRight size={18} />}
                    </button>
                </form>
                
                {shippingError && (
                    <p className={styles.shippingError}>
                        {shippingError}
                    </p>
                )}

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

      {/* --- SESSÃO ESPECIFICAÇÕES --- */}
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