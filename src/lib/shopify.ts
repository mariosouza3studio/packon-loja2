const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN!;

if (!domain || !storefrontAccessToken) {
  throw new Error('⚠️ Faltam variáveis de ambiente da Shopify (.env.local)');
}

async function ShopifyData(query: string, variables = {}) {
  const URL = `https://${domain}/api/2024-01/graphql.json`;
  const options = {
    endpoint: URL,
    method: "POST",
    headers: {
      // Importante: Este cabeçalho SÓ ACEITA tokens da Storefront API
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  };

  try {
    const response = await fetch(URL, options);
    const data = await response.json();

    if (data.errors) {
      console.error("❌ A Shopify Rejeitou:", JSON.stringify(data.errors, null, 2));
      throw new Error("Erro de API Shopify");
    }
    
    return data;
  } catch (error) {
    console.error("❌ Erro de Rede/Fetch:", error);
    throw error;
  }
}
// ... resto do arquivo igual

// --- FUNÇÕES DE BUSCA ---

// 1. Buscar produtos para a sessão "Popular" (Pode ser uma coleção específica)
export async function getProductsInCollection(handle: string) {
  const query = `
  {
    collectionByHandle(handle: "${handle}") {
      title
      products(first: 9) {
        edges {
          node {
            id
            title
            handle
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            # --- CORREÇÃO AQUI ---
            # Adicionamos o campo 'price' para sabermos o valor exato da 1ª opção
            variants(first: 1) {
              edges {
                node {
                  id
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
            # ---------------------
          }
        }
      }
    }
  }`;

  try {
    const response = await ShopifyData(query);
    if (!response.data.collectionByHandle) return [];
    return response.data.collectionByHandle.products.edges;
  } catch (e) {
    console.log("Erro na busca da coleção:", e);
    return []; 
  }
}
// 2. Buscar todas as coleções para a sessão "Categories"
export async function getAllCollections() {
  const query = `
  {
    collections(first: 6) {
      edges {
        node {
          id
          title
          handle
          image {
            url
            altText
          }
        }
      }
    }
  }`;

  const response = await ShopifyData(query);
  return response.data.collections.edges ? response.data.collections.edges : [];
}

// 3. Buscar um produto específico (Para a página de produto futura)
// src/lib/shopify.ts

export async function getProduct(handle: string) {
  // 1. Busca os dados principais do produto (sem as variantes completas ainda)
  const mainQuery = `
  {
    productByHandle(handle: "${handle}") {
      id
      title
      handle
      description
      descriptionHtml
      availableForSale
      
      options {
        name
        values
      }

      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }

      images(first: 20) {
        edges {
          node {
            url
            altText
          }
        }
      }
    }
  }
  `;

  const mainResponse = await ShopifyData(mainQuery);
  const product = mainResponse.data.productByHandle;

  if (!product) return null;

  // 2. Busca TODAS as variantes recursivamente para driblar o limite da API
  // Isso é crucial para produtos com muitas combinações (como o seu)
  const allVariants = await getAllVariants(handle);

  // 3. Injeta as variantes completas no objeto do produto
  return {
    ...product,
    variants: {
      edges: allVariants
    }
  };
}

// ... (seu código anterior continua igual)

// --- MUTAÇÕES DO CARRINHO ---

// 1. Criar um carrinho novo
export async function createCart() {
  const query = `
    mutation cartCreate {
      cartCreate {
        cart {
          id
          checkoutUrl
        }
      }
    }
  `;

  try {
    const response = await ShopifyData(query);
    
    // Se a Shopify devolver erro ou não vier o cart, não quebra o site
    if (!response?.data?.cartCreate?.cart) {
        console.error("Falha ao criar carrinho na Shopify:", response);
        return null; 
    }
    
    return response.data.cartCreate.cart;
  } catch (error) {
    console.error("Erro fatal ao tentar criar carrinho:", error);
    return null; // Retorna null para o Zustand lidar sem travar a tela
  }
}

// 2. Adicionar item ao carrinho
// ... (Mantenha createCart igual) ...

// 2. Adicionar item ao carrinho (ATUALIZADO)
export async function addToCart(cartId: string, lines: { merchandiseId: string; quantity: number }[]) {
  const query = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl  # <--- ADICIONADO AQUI
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                  product {
                    title
                    handle
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
  `;

  const variables = { cartId, lines };
  const response = await ShopifyData(query, variables);
  return response.data.cartLinesAdd.cart;
}

// 3. Recuperar carrinho existente (ATUALIZADO)
export async function getCart(cartId: string) {
  const query = `
  {
    cart(id: "${cartId}") {
      id
      checkoutUrl
      cost {
        totalAmount {
          amount
          currencyCode
        }
        subtotalAmount {
          amount
          currencyCode
        }
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
                price {
                  amount
                  currencyCode
                }
                # ADICIONADO AQUI:
                selectedOptions {
                  name
                  value
                }
                product {
                  title
                  handle
                  images(first: 1) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  `;

  const response = await ShopifyData(query);
  return response.data.cart;
}

// 4. Remover item do carrinho (ATUALIZADO)
export async function removeLinesFromCart(cartId: string, lineIds: string[]) {
  const query = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl # <--- ADICIONADO AQUI
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                  product {
                    title
                    handle
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
  `;

  const variables = { cartId, lineIds };
  const response = await ShopifyData(query, variables);
  return response.data.cartLinesRemove.cart;
}

// 5. Atualizar quantidade (ATUALIZADO)
export async function updateLinesInCart(cartId: string, lines: { id: string; quantity: number }[]) {
  const query = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl # <--- ADICIONADO AQUI
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                  product {
                    title
                    handle
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
  `;

  const variables = { cartId, lines };
  const response = await ShopifyData(query, variables);
  return response.data.cartLinesUpdate.cart;
}

export async function getCollectionProducts(collectionHandle: string, sortKey = "CREATED", reverse = false) {
  const query = `
  {
    collectionByHandle(handle: "${collectionHandle}") {
      title
      products(first: 100, sortKey: ${sortKey}, reverse: ${reverse}) {
        edges {
          node {
            id
            title
            handle
            productType 
            availableForSale
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            # --- CORREÇÃO AQUI TAMBÉM ---
            variants(first: 1) {
              edges {
                node {
                  id
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                      name
                      value
                  }
                }
              }
            }
            # ----------------------------
          }
        }
      }
    }
  }`;

  const response = await ShopifyData(query);
  return response.data.collectionByHandle?.products.edges || [];
}

// src/lib/shopify.ts

// ... suas outras funções ...

// 4. Buscar produtos por termo (Search)
export async function searchProducts(term: string) {
  // A query busca produtos onde o título contém o termo
  const query = `
  {
    products(first: 5, query: "title:${term}*") {
      edges {
        node {
          id
          title
          handle
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }`;

  try {
    const response = await ShopifyData(query);
    return response.data.products.edges;
  } catch (error) {
    console.error("Erro na busca:", error);
    return [];
  }
}



async function getAllVariants(handle: string, cursor: string | null = null, accumulatedVariants: any[] = []): Promise<any[]> {
  const query = `
  query getProductVariants($handle: String!, $cursor: String) {
    productByHandle(handle: $handle) {
      variants(first: 250, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
            image {
              url
            }
          }
        }
      }
    }
  }
  `;

  const response = await ShopifyData(query, { handle, cursor });
  const data = response.data.productByHandle.variants;
  
  const newVariants = [...accumulatedVariants, ...data.edges];

  if (data.pageInfo.hasNextPage) {
    // Se tiver mais páginas, chama a função de novo (recursividade)
    return getAllVariants(handle, data.pageInfo.endCursor, newVariants);
  }

  return newVariants;
}