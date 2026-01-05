// src/lib/shopify.ts
import { 
  ShopifyProduct, 
  ShopifyCart, 
  Connection, 
  ShopifyVariant,
  Edge
} from "./shopify/types";

const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN!;

if (!domain || !storefrontAccessToken) {
  throw new Error('⚠️ Faltam variáveis de ambiente da Shopify (.env.local)');
}

// Interface padronizada para resposta da API
interface ShopifyResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

// Configuração de Cache
interface ShopifyFetchOptions {
  cache?: RequestCache;
  tags?: string[];
  revalidate?: number;
}

/**
 * Função Fetcher Genérica, Blindada e com Cache
 */
async function ShopifyData<T>(
  query: string, 
  variables = {}, 
  options: ShopifyFetchOptions = {}
): Promise<ShopifyResponse<T>> {
  const URL = `https://${domain}/api/2024-01/graphql.json`;
  
  const { cache, tags, revalidate } = options;

  const fetchOptions: RequestInit = {
    method: "POST",
    headers: {
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    // ESTRATÉGIA DE CACHE:
    // 1. Se passar tags/revalidate, usa o 'next' options (Padrão Next.js 14+)
    // 2. Se não, usa o cache padrão 'force-cache'
    ...(cache && { cache }),
    ...((tags || revalidate) && { 
      next: { 
        tags, 
        revalidate 
      } 
    })
  };

  // Substitua o trecho do try/catch na função ShopifyData

try {
  // Adicionar timeout para não travar a requisição infinitamente
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos de timeout

  const response = await fetch(URL, { ...fetchOptions, signal: controller.signal });
  clearTimeout(timeoutId);
  
  if (!response.ok) {
      // Log mais descritivo sem expor dados sensíveis ao cliente
      console.error(`[Shopify Fetch Error] Status: ${response.status} ${response.statusText} | Query: ${query.substring(0, 50)}...`);
      // Retornar um objeto de erro padronizado ao invés de throw crashar tudo
      return { data: {} as T, errors: [{ message: `Erro de comunicação: ${response.status}` }] };
  }

  const data = await response.json();

  if (data.errors) {
    console.error("[Shopify GraphQL Error]", JSON.stringify(data.errors, null, 2));
    // Não dar throw aqui permite que a UI decida o que fazer (ex: mostrar lista vazia ao invés de página de erro 500)
  }
  
  return data;
} catch (error: any) {
  console.error("[Shopify Network Error]", error);
  // Retorno seguro para não quebrar a destructuring { data } no consumidor
  return { 
    data: {} as T, 
    errors: [{ message: error.name === 'AbortError' ? 'Timeout na requisição' : 'Falha de rede' }] 
  };
}
}

// ==========================================
// PRODUTOS E COLEÇÕES
// ==========================================

export async function getProductsInCollection(handle: string): Promise<Edge<ShopifyProduct>[]> {
  const query = `
  {
    collectionByHandle(handle: "${handle}") {
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

  // Cache: Revalida a cada 1 hora ou se a tag 'collection' for invalidada
  const response = await ShopifyData<{ collectionByHandle: { products: Connection<ShopifyProduct> } }>(
    query, 
    {}, 
    { tags: ['collection', 'products'], revalidate: 3600 } 
  );
  
  return response.data?.collectionByHandle?.products?.edges || [];
}

export async function getAllCollections() {
  const query = `
  {
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

  const response = await ShopifyData<{ collections: Connection<any> }>(
    query,
    {},
    { tags: ['collections'], revalidate: 86400 } // Cache longo (24h) para lista de coleções
  );
  return response.data?.collections?.edges || [];
}

export async function getCollectionProducts(collectionHandle: string, sortKey = "CREATED", reverse = false) {
  const query = `
  {
    collectionByHandle(handle: "${collectionHandle}") {
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

  const response = await ShopifyData<{ collectionByHandle: { products: Connection<ShopifyProduct> } }>(
    query,
    {},
    { tags: ['products', `collection-${collectionHandle}`], revalidate: 3600 }
  );
  return response.data?.collectionByHandle?.products?.edges || [];
}

// ==========================================
// DETALHE DO PRODUTO (Recursividade Type-Safe)
// ==========================================

export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  const mainQuery = `
  {
    productByHandle(handle: "${handle}") {
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
    {},
    { tags: [`product-${handle}`], revalidate: 1800 } // 30 min cache para produto individual
  );
  
  const product = mainResponse.data?.productByHandle;

  if (!product) return null;

  // Busca TODAS as variantes recursivamente
  const allVariants = await getAllVariants(handle);

  return {
    ...product,
    variants: {
      edges: allVariants
    }
  };
}

// Helper recursivo Type-Safe
async function getAllVariants(
  handle: string, 
  cursor: string | null = null, 
  accumulatedVariants: Edge<ShopifyVariant>[] = [] // Tipagem corrigida: Array de Edges
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
    { handle, cursor },
    { cache: 'no-store' } // Variantes não devem cachear agressivamente na recursão para evitar dados parciais
  );
  
  const variantData = response.data?.productByHandle?.variants;
  
  if (!variantData) return accumulatedVariants;

  const newVariants = [...accumulatedVariants, ...variantData.edges];

  if (variantData.pageInfo?.hasNextPage) {
    return getAllVariants(handle, variantData.pageInfo.endCursor, newVariants);
  }

  return newVariants;
}

// ==========================================
// CARRINHO (CART) - SEMPRE NO-STORE (Dados Frescos)
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

// Carrinho nunca deve ter cache
const CART_OPTIONS: ShopifyFetchOptions = { cache: 'no-store' };

export async function createCart(): Promise<ShopifyCart | null> {
  const query = `mutation cartCreate { cartCreate { cart { ${CART_FRAGMENT} } } }`;
  const response = await ShopifyData<{ cartCreate: { cart: ShopifyCart } }>(query, {}, CART_OPTIONS);
  return response.data?.cartCreate?.cart || null;
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const query = `{ cart(id: "${cartId}") { ${CART_FRAGMENT} } }`;
  const response = await ShopifyData<{ cart: ShopifyCart }>(query, {}, CART_OPTIONS);
  return response.data?.cart || null;
}

export async function addToCart(cartId: string, lines: { merchandiseId: string; quantity: number }[]): Promise<ShopifyCart | null> {
  const query = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ${CART_FRAGMENT} }
    }
  }`;
  const response = await ShopifyData<{ cartLinesAdd: { cart: ShopifyCart } }>(query, { cartId, lines }, CART_OPTIONS);
  return response.data?.cartLinesAdd?.cart || null;
}

export async function removeLinesFromCart(cartId: string, lineIds: string[]): Promise<ShopifyCart | null> {
  const query = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ${CART_FRAGMENT} }
    }
  }`;
  const response = await ShopifyData<{ cartLinesRemove: { cart: ShopifyCart } }>(query, { cartId, lineIds }, CART_OPTIONS);
  return response.data?.cartLinesRemove?.cart || null;
}

export async function updateLinesInCart(cartId: string, lines: { id: string; quantity: number }[]): Promise<ShopifyCart | null> {
  const query = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ${CART_FRAGMENT} }
    }
  }`;
  const response = await ShopifyData<{ cartLinesUpdate: { cart: ShopifyCart } }>(query, { cartId, lines }, CART_OPTIONS);
  return response.data?.cartLinesUpdate?.cart || null;
}

// ==========================================
// BUSCA (SEARCH)
// ==========================================

export async function searchProducts(term: string) {
  const query = `
  {
    products(first: 5, query: "title:${term}*") {
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

  // Busca rápida pode ter um cache curto
  const response = await ShopifyData<{ products: Connection<any> }>(
    query, 
    {}, 
    { revalidate: 300 } // 5 minutos
  );
  return response.data?.products?.edges || [];
}