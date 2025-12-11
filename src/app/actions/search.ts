// src/app/actions/search.ts
"use server";

import { searchProducts } from "@/lib/shopify";

export async function performSearch(term: string) {
  if (!term || term.length < 2) return [];
  
  const products = await searchProducts(term);
  
  // Limpamos os dados para retornar apenas o necessário para o componente
  return products.map(({ node }: any) => ({
    id: node.id,
    title: node.title,
    handle: node.handle,
    image: node.images.edges[0]?.node.url || null,
    price: node.priceRange.minVariantPrice.amount // Opcional, se quiser mostrar preço
  }));
}