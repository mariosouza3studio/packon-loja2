// src/hooks/useShipping.ts
"use client";

import { useState } from "react";
import { calculateShipping } from "@/app/actions/shipping";
import { toast } from "sonner";

interface ShippingOption {
  name: string;
  carrier: string;
  price: number;
  days: number;
}

export function useShipping() {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[] | null>(null);

  const formatCep = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    setCep(v);
  };

  const calculate = async (variantPrice: number, weight: number = 1) => {
    setOptions(null);
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length < 8) {
      toast.warning("Por favor, digite um CEP válido.");
      return;
    }

    setLoading(true);

    try {
      const result = await calculateShipping(cleanCep, [{
        quantity: 1,
        price: variantPrice,
        weight: weight
      }]);

      if (result.error) {
        toast.error(result.error);
        setOptions(null);
      } else if (result.options && result.options.length > 0) {
        setOptions(result.options.slice(0, 3)); // Pega as 3 melhores opções
        toast.success("Frete calculado com sucesso!");
      } else {
        toast.info("Nenhuma opção de entrega encontrada para este CEP.");
        setOptions(null);
      }
    } catch (error) {
      toast.error("Erro de comunicação ao calcular frete.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    cep,
    handleCepChange: formatCep,
    calculate,
    loading,
    options,
    hasCalculated: options !== null
  };
}