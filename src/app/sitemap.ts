import { getCollectionProducts } from '@/lib/shopify';
import { MetadataRoute } from 'next';

const BASE_URL = 'https://packon.com.br'; // Ajuste para seu domínio final

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Rotas Estáticas
  const routes = ['', '/produtos'].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 1.0,
  }));

  // 2. Rotas Dinâmicas (Produtos)
  const products = await getCollectionProducts("products"); // Use o handle da coleção principal
  
  const productRoutes = products.map(({ node }: any) => ({
    url: `${BASE_URL}/produtos/${node.handle}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...routes, ...productRoutes];
}