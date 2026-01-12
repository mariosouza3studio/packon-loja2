// src/app/actions/search.ts
"use server";

import { searchProducts } from "@/lib/shopify";
import { ShopifyProduct, Edge } from "@/lib/shopify/types";
import { z } from "zod";

// --- SCHEMAS DE VALIDAÇÃO (ZOD) ---

// Schema de entrada: Valida o termo digitado
const SearchInputSchema = z.string()
  .trim() // Remove espaços no início/fim
  .min(2, "A busca deve ter pelo menos 2 caracteres")
  .max(100, "Termo de busca muito longo"); // Proteção contra ataques de buffer

// Interface de Retorno para o Frontend
export interface SearchResultItem {
  id: string;
  title: string;
  handle: string;
  image: string | null;
  price: string;
}

export async function performSearch(term: string): Promise<SearchResultItem[]> {
  // 1. Validação "Fail-Fast"
  const parsed = SearchInputSchema.safeParse(term);

  if (!parsed.success) {
    // Se a validação falhar, retornamos vazio silenciosamente (ou poderíamos logar o erro)
    return [];
  }

  const safeTerm = parsed.data;

  try {
    // 2. Chamada à Shopify
    const products: Edge<ShopifyProduct>[] = await searchProducts(safeTerm);

    if (!products || products.length === 0) {
      return [];
    }

    // 3. Mapeamento e Sanitização de Saída
    // Garantimos que, mesmo se a Shopify mudar algo, o front recebe o formato esperado
    return products.map(({ node }) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      // Fallback seguro para imagem
      image: node.images.edges[0]?.node.url ?? null,
      // Fallback seguro para preço
      price: node.priceRange.minVariantPrice.amount ?? "0.00"
    }));

  } catch (error) {
    console.error(`[Search Action Error] Termo: "${safeTerm}"`, error);
    return []; // Falha graciosa
  }
}