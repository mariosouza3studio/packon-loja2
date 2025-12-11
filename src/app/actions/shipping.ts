// src/app/actions/shipping.ts
"use server";

interface ShippingItem {
  quantity: number;
  price: number;
  weight: number; // Em KG (ex: 0.5 para 500g)
}

interface FrenetResponse {
  ShippingSevicesArray: Array<{
    ServiceDescription: string;
    ShippingPrice: string;
    DeliveryTime: string;
    Error: boolean;
    Msg?: string;
    Carrier: string;
  }>;
}

export async function calculateShipping(destCep: string, items: ShippingItem[]) {
  const token = process.env.FRENET_TOKEN;
  const originCep = process.env.FRENET_CEP_ORIGIN;

  if (!token || !originCep) {
    console.error("⚠️ Configuração da Frenet ausente no .env");
    return { error: "Erro de configuração no servidor." };
  }

  // Prepara os itens para o formato da Frenet
  // OBS: Como Shopify Storefront as vezes não manda dimensões, usamos um fallback de caixa pequena (20x20x20)
  // O peso é o mais importante para o cálculo base.
  const shippingItems = items.map((item) => ({
    Weight: item.weight > 0 ? item.weight : 1, // Mínimo 1kg se vier zerado
    Length: 20, // Ajuste conforme sua embalagem média
    Height: 20,
    Width: 20,
    Quantity: item.quantity,
    IsFragile: false
  }));

  const totalValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const payload = {
    SellerCEP: originCep.replace(/\D/g, ''),
    RecipientCEP: destCep.replace(/\D/g, ''),
    ShipmentInvoiceValue: totalValue,
    ShippingItemArray: shippingItems,
    RecipientCountry: "BR"
  };

  try {
    const response = await fetch("http://api.frenet.com.br/shipping/quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": token
      },
      body: JSON.stringify(payload),
      cache: "no-store" // Importante para não cachear cotações
    });

    if (!response.ok) {
        throw new Error("Falha na comunicação com Frenet");
    }

    const data: FrenetResponse = await response.json();

    // Filtra apenas os serviços sem erro e ordena pelo preço
    const availableOptions = data.ShippingSevicesArray
      .filter(service => !service.Error)
      .map(service => ({
        name: service.ServiceDescription, // Ex: SEDEX, PAC, Jadlog
        carrier: service.Carrier,
        price: parseFloat(service.ShippingPrice),
        days: parseInt(service.DeliveryTime)
      }))
      .sort((a, b) => a.price - b.price); // Menor preço primeiro

    return { success: true, options: availableOptions };

  } catch (error) {
    console.error("Erro Frenet:", error);
    return { error: "Não foi possível calcular o frete agora." };
  }
}