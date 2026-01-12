// src/lib/shopify/types.ts

// Padrão de conexão do GraphQL (Reutilizável)
export type Edge<T> = {
  node: T;
};

export type Connection<T> = {
  edges: Array<Edge<T>>;
  pageInfo?: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
};

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width?: number;
  height?: number;
}

export interface ShopifyPrice {
  amount: string;
  currencyCode: string;
}

export interface ShopifyOption {
  id: string;
  name: string;
  values: string[];
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: SelectedOption[];
  price: ShopifyPrice;
  // A imagem é opcional na variante, mas se existir, segue o padrão
  image?: ShopifyImage; 
  product?: {
    title: string;
    handle: string;
  };
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  productType?: string;
  options: ShopifyOption[];
  priceRange: {
    minVariantPrice: ShopifyPrice;
    maxVariantPrice: ShopifyPrice;
  };
  images: Connection<ShopifyImage>;
  variants: Connection<ShopifyVariant>;
  updatedAt?: string; // Útil para sitemaps
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: ShopifyPrice;
    product: {
      title: string;
      handle: string;
      images: Connection<ShopifyImage>;
    };
    selectedOptions: SelectedOption[];
  };
}

export interface CartCost {
  totalAmount: ShopifyPrice;
  subtotalAmount: ShopifyPrice;
  totalTaxAmount?: ShopifyPrice;
  totalDutyAmount?: ShopifyPrice;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  cost: CartCost;
  lines: Connection<CartLine>;
  totalQuantity: number;
}


export interface ShopifyError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: {
    code?: string;
    documentation?: string;
  };
}

// Interface Genérica de Resposta da Shopify
export interface ShopifyResponse<T> {
  data?: T;
  errors?: ShopifyError[];
}