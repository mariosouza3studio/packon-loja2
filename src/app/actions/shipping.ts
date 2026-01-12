// src/app/actions/shipping.ts
"use server";

import { z } from "zod";

// --- SCHEMAS DE VALIDAÇÃO (ZOD) ---

// Validação de um item individual do carrinho
const ShippingItemSchema = z.object({
  quantity: z.number().int().positive("Quantidade deve ser maior que zero"),
  price: z.number().nonnegative("Preço não pode ser negativo"),
  weight: z.number().nonnegative("Peso não pode ser negativo")
});

// Validação dos dados de entrada completos
const CalculateShippingSchema = z.object({
  destCep: z.string()
    .min(8, "CEP incompleto")
    .transform((val) => val.replace(/\D/g, '')) // Remove tudo que não for número automaticamente
    .refine((val) => val.length === 8, "CEP inválido após formatação"),
  items: z.array(ShippingItemSchema).min(1, "O carrinho está vazio")
});

// Interfaces de Tipo (Inferidas do Zod ou Manuais)
type ShippingItem = z.infer<typeof ShippingItemSchema>;

interface FrenetService {
  ServiceDescription: string;
  ShippingPrice: string;
  DeliveryTime: string;
  Error: boolean;
  Msg?: string;
  Carrier: string;
}

interface FrenetResponse {
  ShippingSevicesArray: Array<FrenetService>;
  Message?: string; // Frenet as vezes retorna erros globais aqui
}

interface ShippingOption {
  name: string;
  carrier: string;
  price: number;
  days: number;
}

interface ShippingResult {
  success?: boolean;
  options?: ShippingOption[];
  error?: string;
}

export async function calculateShipping(rawDestCep: string, rawItems: ShippingItem[]): Promise<ShippingResult> {
  // 1. Validação de Variáveis de Ambiente (Sanity Check do Servidor)
  const token = process.env.FRENET_TOKEN;
  const originCep = process.env.FRENET_CEP_ORIGIN;

  if (!token || !originCep) {
    console.error("⚠️ CRÍTICO: Configuração da Frenet ausente no .env");
    return { error: "Erro interno de configuração de frete." };
  }

  // 2. Validação e Transformação dos Inputs com Zod
  const parsed = CalculateShippingSchema.safeParse({
    destCep: rawDestCep,
    items: rawItems
  });

  if (!parsed.success) {
    // Retorna o primeiro erro de validação encontrado de forma amigável
    const errorMessage = parsed.error.issues[0].message;
    return { error: errorMessage || "Dados de entrega inválidos." };
  }

  const { destCep, items } = parsed.data;

  // 3. Preparação do Payload
  // Prepara os itens para o formato da Frenet
  const shippingItems = items.map((item) => ({
    Weight: item.weight > 0 ? item.weight : 1, // Garante peso mínimo de 1kg se vier 0
    Length: 20, // Dimensões fixas (idealmente viriam do cadastro do produto no futuro)
    Height: 20,
    Width: 20,
    Quantity: item.quantity,
    IsFragile: false
  }));

  const totalValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const payload = {
    SellerCEP: originCep.replace(/\D/g, ''),
    RecipientCEP: destCep,
    ShipmentInvoiceValue: totalValue,
    ShippingItemArray: shippingItems,
    RecipientCountry: "BR"
  };

  try {
    const response = await fetch("https://api.frenet.com.br/shipping/quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": token
      },
      body: JSON.stringify(payload),
      cache: "no-store", // CRUCIAL: Cotação é em tempo real, nunca cachear
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error(`[Frenet API Error] Status: ${response.status}`);
      throw new Error("Falha na comunicação com transportadora");
    }

    const data: FrenetResponse = await response.json();

    // Verificação se a resposta da Frenet tem a estrutura esperada
    if (!data.ShippingSevicesArray) {
      console.warn("[Frenet] Resposta inesperada:", data);
      return { error: "Não foram encontradas opções de entrega para este CEP." };
    }

    // 4. Filtragem e Normalização
    const availableOptions = data.ShippingSevicesArray
      .filter(service => !service.Error)
      .map(service => ({
        name: service.ServiceDescription,
        carrier: service.Carrier,
        price: parseFloat(service.ShippingPrice),
        days: parseInt(service.DeliveryTime)
      }))
      .sort((a, b) => a.price - b.price); // Ordena do mais barato para o mais caro

    if (availableOptions.length === 0) {
      return { error: "Nenhuma transportadora disponível para esta região." };
    }

    return { success: true, options: availableOptions };

  } catch (error) {
    console.error("Erro Action Shipping:", error);
    return { error: "Não foi possível calcular o frete no momento. Tente novamente." };
  }
}