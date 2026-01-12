// src/lib/shopify.ts

import { 
  ShopifyProduct, 
  ShopifyCart, 
  Connection, 
  ShopifyVariant, 
  Edge 
} from "./shopify/types";


// --- 1. Validação "Fail-Fast" de Variáveis de Ambiente ---
const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;
const API_VERSION = "2024-01"; // Constante para fácil atualização

if (!domain || !storefrontAccessToken) {
  throw new Error('⚠️ CRÍTICO: Variáveis de ambiente da Shopify não configuradas (.env.local)');
}

const ENDPOINT = `https://${domain}/api/${API_VERSION}/graphql.json`;

// --- 2. Interfaces e Tipos Auxiliares ---

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'created_desc';

interface ShopifyFetchOptions {
  cache?: RequestCache;
  tags?: string[];
  revalidate?: number;
  variables?: Record<string, any>;
}

interface ShopifyError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
}

interface ShopifyResponse<T> {
  data?: T;
  errors?: ShopifyError[];
}

interface FilterOptions {
  query?: string; // Busca textual
  productType?: string;
  maxPrice?: number;
  sort?: SortOption;
  reverse?: boolean;
}

// --- 3. Utilitário de Delay para Backoff (Espera Inteligente) ---
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Função Fetcher Robusta
 * - Suporta Retries automáticos (429/5xx)
 * - Timeout configurado
 * - Tipagem genérica
 */
async function ShopifyData<T>(
  query: string, 
  options: ShopifyFetchOptions = {}
): Promise<{ data: T; errors?: ShopifyError[] }> { // Retorno simplificado para uso interno
  
  const { cache, tags, revalidate, variables = {} } = options;
  
  // Configurações de Resiliência
  const MAX_RETRIES = 3;
  const BASE_DELAY = 500; // 500ms inicial
  const TIMEOUT_MS = 8000; // 8 segundos limite

  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const headers = {
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken!,
        "Content-Type": "application/json",
        "Accept": "application/json",
      };

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
        ...(cache && { cache }),
        ...((tags || revalidate) && { 
          next: { 
            tags, 
            revalidate 
          } 
        })
      });

      clearTimeout(timeoutId);

      // --- Lógica de Rate Limiting (Throttle) ---
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter 
          ? parseInt(retryAfter, 10) * 1000 
          : BASE_DELAY * Math.pow(2, attempt); // Backoff Exponencial (500ms -> 1000ms -> 2000ms)

        console.warn(`[Shopify] Rate Limit/Erro ${response.status}. Tentativa ${attempt + 1}/${MAX_RETRIES}. Aguardando ${waitTime}ms...`);
        await sleep(waitTime);
        attempt++;
        continue; // Tenta de novo
      }

      if (!response.ok) {
        throw new Error(`[Shopify API Error] Status: ${response.status} ${response.statusText}`);
      }

      const json: ShopifyResponse<T> = await response.json();

      if (json.errors) {
        // Log detalhado mas seguro
        console.error("[Shopify GraphQL Error]", JSON.stringify(json.errors.map(e => e.message), null, 2));
        // Dependendo da severidade, poderíamos lançar erro, mas retornamos para a UI tratar
      }

      return { 
        data: json.data as T, 
        errors: json.errors 
      };

    } catch (error: any) {
      const isTimeout = error.name === 'AbortError';
      
      // Se for timeout ou erro de rede, tentamos de novo
      if (isTimeout || error.message.includes('fetch')) {
         console.warn(`[Shopify Network/Timeout] Tentativa ${attempt + 1}/${MAX_RETRIES} falhou.`);
         attempt++;
         if (attempt === MAX_RETRIES) {
            console.error(`[Shopify Critical] Falha final após ${MAX_RETRIES} tentativas.`);
            return { 
               data: {} as T, 
               errors: [{ message: isTimeout ? 'O servidor demorou muito para responder.' : 'Erro de conexão com a loja.' }] 
            };
         }
         await sleep(BASE_DELAY * Math.pow(2, attempt)); // Espera antes de tentar
         continue;
      }

      // Erros de programação ou lógica não devem ter retry
      console.error("[Shopify Critical Error]", error);
      return { data: {} as T, errors: [{ message: error.message }] };
    }
  }

  return { data: {} as T, errors: [{ message: "Erro desconhecido na comunicação." }] };
}

// ==========================================
// MÉTODOS PÚBLICOS (API)
// ==========================================

export async function getProductsInCollection(handle: string): Promise<Edge<ShopifyProduct>[]> {
  const query = `
  query getCollectionProducts($handle: String!) {
    collectionByHandle(handle: $handle) {
      products(first: 9) {
        edges {
          node {
            id
            title
            handle
            productType
            availableForSale
            priceRange {
              minVariantPrice { amount currencyCode }
            }
            images(first: 1) {
              edges {
                node { url altText }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  availableForSale
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  }`;

  const res = await ShopifyData<{ collectionByHandle: { products: Connection<ShopifyProduct> } }>(
    query, 
    { 
      variables: { handle }, // Usando variáveis GraphQL (Mais seguro e limpo)
      tags: ['collection', 'products'], 
      revalidate: 3600 
    }
  );
  
  return res.data?.collectionByHandle?.products?.edges || [];
}

export async function getAllCollections() {
  const query = `
  query getCollections {
    collections(first: 10) {
      edges {
        node {
          id
          title
          handle
          image { url altText }
        }
      }
    }
  }`;

  const res = await ShopifyData<{ collections: Connection<any> }>(
    query,
    { tags: ['collections'], revalidate: 86400 }
  );
  return res.data?.collections?.edges || [];
}

export async function getCollectionProducts(collectionHandle: string, sortKey = "CREATED", reverse = false) {
  // Nota: sortKey e reverse não são variáveis simples, geralmente são Enums no GraphQL, 
  // então interpolar na string ainda é comum, mas o handle deve ser var.
  const query = `
  query getCollectionProductsSorted($handle: String!) {
    collectionByHandle(handle: $handle) {
      products(first: 100, sortKey: ${sortKey}, reverse: ${reverse}) {
        edges {
          node {
            id
            title
            handle
            productType
            availableForSale
            priceRange {
              minVariantPrice { amount currencyCode }
            }
            images(first: 1) {
              edges { node { url altText } }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  availableForSale
                  price { amount currencyCode }
                  selectedOptions { name value }
                }
              }
            }
          }
        }
      }
    }
  }`;

  const res = await ShopifyData<{ collectionByHandle: { products: Connection<ShopifyProduct> } }>(
    query,
    { 
      variables: { handle: collectionHandle },
      tags: ['products', `collection-${collectionHandle}`], 
      revalidate: 3600 
    }
  );
  return res.data?.collectionByHandle?.products?.edges || [];
}

export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  const mainQuery = `
  query getProductDetails($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      availableForSale
      options { name values }
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
      images(first: 20) {
        edges {
          node { url altText }
        }
      }
    }
  }
  `;

  const mainResponse = await ShopifyData<{ productByHandle: ShopifyProduct }>(
    mainQuery,
    { 
      variables: { handle },
      tags: [`product-${handle}`], 
      revalidate: 1800 
    }
  );
  
  const product = mainResponse.data?.productByHandle;

  if (!product) return null;

  // Busca TODAS as variantes recursivamente
  const allVariants = await getAllVariants(handle);

  return {
    ...product,
    variants: {
      edges: allVariants,
      pageInfo: { hasNextPage: false, endCursor: null } // Mock para satisfazer o tipo Connection
    }
  };
}

// Helper recursivo Type-Safe
async function getAllVariants(
  handle: string, 
  cursor: string | null = null, 
  accumulatedVariants: Edge<ShopifyVariant>[] = [] 
): Promise<Edge<ShopifyVariant>[]> {
  
  const query = `
  query getProductVariants($handle: String!, $cursor: String) {
    productByHandle(handle: $handle) {
      variants(first: 250, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            id
            title
            availableForSale
            price { amount currencyCode }
            selectedOptions { name value }
            image { url altText } 
          }
        }
      }
    }
  }
  `;

  const response = await ShopifyData<{ productByHandle: { variants: Connection<ShopifyVariant> } }>(
    query, 
    { 
      variables: { handle, cursor },
      cache: 'no-store' // Recursão sempre fresca
    } 
  );
  
  const variantData = response.data?.productByHandle?.variants;
  
  if (!variantData) return accumulatedVariants;

  const newVariants = [...accumulatedVariants, ...variantData.edges];

  if (variantData.pageInfo?.hasNextPage) {
    // Delay pequeno para não bater rate limit em produtos com muitas variantes
    await sleep(200); 
    return getAllVariants(handle, variantData.pageInfo.endCursor, newVariants);
  }

  return newVariants;
}

// ==========================================
// CARRINHO (CART) - SEMPRE NO-STORE
// ==========================================

const CART_FRAGMENT = `
  id
  checkoutUrl
  totalQuantity
  cost {
    totalAmount { amount currencyCode }
    subtotalAmount { amount currencyCode }
  }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price { amount currencyCode }
            selectedOptions { name value }
            product {
              title
              handle
              images(first: 1) {
                edges { node { url altText } }
              }
            }
          }
        }
      }
    }
  }
`;

const CART_OPTIONS: Partial<ShopifyFetchOptions> = { cache: 'no-store' };

export async function createCart(): Promise<ShopifyCart | null> {
  const query = `mutation cartCreate { cartCreate { cart { ${CART_FRAGMENT} } } }`;
  const res = await ShopifyData<{ cartCreate: { cart: ShopifyCart } }>(query, CART_OPTIONS);
  return res.data?.cartCreate?.cart || null;
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const query = `query getCart($id: ID!) { cart(id: $id) { ${CART_FRAGMENT} } }`;
  const res = await ShopifyData<{ cart: ShopifyCart }>(
    query, 
    { ...CART_OPTIONS, variables: { id: cartId } }
  );
  return res.data?.cart || null;
}

export async function addToCart(cartId: string, lines: { merchandiseId: string; quantity: number }[]): Promise<ShopifyCart | null> {
  const query = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ${CART_FRAGMENT} }
    }
  }`;
  const res = await ShopifyData<{ cartLinesAdd: { cart: ShopifyCart } }>(
    query, 
    { ...CART_OPTIONS, variables: { cartId, lines } }
  );
  return res.data?.cartLinesAdd?.cart || null;
}

export async function removeLinesFromCart(cartId: string, lineIds: string[]): Promise<ShopifyCart | null> {
  const query = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ${CART_FRAGMENT} }
    }
  }`;
  const res = await ShopifyData<{ cartLinesRemove: { cart: ShopifyCart } }>(
    query, 
    { ...CART_OPTIONS, variables: { cartId, lineIds } }
  );
  return res.data?.cartLinesRemove?.cart || null;
}

export async function updateLinesInCart(cartId: string, lines: { id: string; quantity: number }[]): Promise<ShopifyCart | null> {
  const query = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ${CART_FRAGMENT} }
    }
  }`;
  const res = await ShopifyData<{ cartLinesUpdate: { cart: ShopifyCart } }>(
    query, 
    { ...CART_OPTIONS, variables: { cartId, lines } }
  );
  return res.data?.cartLinesUpdate?.cart || null;
}

// ==========================================
// BUSCA (SEARCH)
// ==========================================

export async function searchProducts(term: string) {
  // Sanitização simples para evitar quebra da query string
  const sanitizedTerm = term.replace(/"/g, '\\"');
  
  const query = `
  query searchProducts($query: String!) {
    products(first: 5, query: $query) {
      edges {
        node {
          id
          title
          handle
          images(first: 1) {
            edges { node { url altText } }
          }
          priceRange {
            minVariantPrice { amount currencyCode }
          }
        }
      }
    }
  }`;

  const res = await ShopifyData<{ products: Connection<any> }>(
    query,
    { 
      variables: { query: `title:${sanitizedTerm}*` },
      revalidate: 300 // 5 minutos de cache para busca
    }
  );
  return res.data?.products?.edges || [];
}


