// src/hooks/useProductVariant.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ShopifyProduct, ShopifyVariant } from "@/lib/shopify/types";

export function useProductVariant(product: ShopifyProduct) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentVariant, setCurrentVariant] = useState<ShopifyVariant | null>(null);

  // 1. Inicialização baseada na URL ou Padrão
  useEffect(() => {
    const variantIdFromUrl = searchParams.get('variant');
    let targetVariant: ShopifyVariant | undefined;

    const variants = product.variants.edges;

    // Tenta achar pela URL
    if (variantIdFromUrl) {
      targetVariant = variants.find((v) => v.node.id === variantIdFromUrl)?.node;
    }

    // Se não achar, pega o primeiro disponível
    if (!targetVariant) {
      targetVariant = variants.find((v) => v.node.availableForSale)?.node 
                      || variants[0]?.node;
    }

    if (targetVariant) {
      setCurrentVariant(targetVariant);
      
      const newOptions: Record<string, string> = {};
      targetVariant.selectedOptions.forEach((opt) => {
        newOptions[opt.name] = opt.value;
      });
      setSelectedOptions(newOptions);
    }
  }, [product, searchParams]);

  // 2. Atualiza a URL sem recarregar a página (Shallow Routing)
  const updateUrl = useCallback((variantId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('variant', variantId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // 3. Verifica se uma combinação é válida (Lógica de Negócio)
  const isOptionValid = useCallback((optionName: string, value: string) => {
    return product.variants.edges.some(({ node }) => {
       // A variante precisa ter o valor testado
       const hasValue = node.selectedOptions.some((opt) => opt.name === optionName && opt.value === value);
       if (!hasValue) return false;

       // A variante precisa ser compatível com as OUTRAS opções já selecionadas
       const isCompatible = node.selectedOptions.every((opt) => {
         // Ignora a própria opção que estamos testando
         if (opt.name === optionName) return true;
         
         // REGRA DE NEGÓCIO DA PACKON: Ignorar "Quantidade" na validação cruzada
         if (opt.name === "Quantidade") return true; 

         return selectedOptions[opt.name] === opt.value;
       });

       return isCompatible && node.availableForSale;
    });
  }, [product, selectedOptions]);

  // 4. Manipulador de Mudança
  const handleOptionChange = useCallback((optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);

    // Tenta achar match exato
    const matchedVariant = product.variants.edges.find(({ node }) => {
      return node.selectedOptions.every((opt) => newOptions[opt.name] === opt.value);
    })?.node;

    if (matchedVariant) {
      setCurrentVariant(matchedVariant);
      updateUrl(matchedVariant.id);
      return matchedVariant;
    } else {
       // Fallback: Procura variante aproximada válida
       const fallbackVariant = product.variants.edges.find(({ node }) => {
            const hasNewValue = node.selectedOptions.some((opt) => opt.name === optionName && opt.value === value);
            return hasNewValue && node.availableForSale;
       })?.node;

       if (fallbackVariant) {
          const fallbackOptions: Record<string, string> = {};
          fallbackVariant.selectedOptions.forEach((opt) => fallbackOptions[opt.name] = opt.value);
          
          setSelectedOptions(fallbackOptions);
          setCurrentVariant(fallbackVariant);
          updateUrl(fallbackVariant.id);
          return fallbackVariant;
       }
    }
    return null;
  }, [product, selectedOptions, updateUrl]);

  return {
    currentVariant,
    selectedOptions,
    handleOptionChange,
    isOptionValid
  };
}