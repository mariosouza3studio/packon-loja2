import { getCollectionProducts, getAllCollections } from '@/lib/shopify';
import { MetadataRoute } from 'next';

const BASE_URL = 'https://packon.com.br';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Páginas Estáticas
  const staticRoutes = [
    '', 
    '/produtos',
    '/contato' // Se tiver rota separada
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. Produtos (Prioridade Alta)
  // Nota: getCollectionProducts("products") traz todos. Se tiver muitos, considere paginação aqui.
  const productsData = await getCollectionProducts("products");
  const productRoutes = productsData.map(({ node }: any) => ({
    url: `${BASE_URL}/produtos/${node.handle}`,
    lastModified: node.updatedAt || new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // 3. Coleções (Categorias)
  // Precisamos garantir que você tenha uma função getAllCollections no shopify.ts (vimos na análise que sim)
  const collectionsData = await getAllCollections();
  const collectionRoutes = collectionsData.map(({ node }: any) => ({
    url: `${BASE_URL}/colecoes/${node.handle}`, // Ajuste se sua rota for diferente (ex: /categoria/handle)
    lastModified: node.updatedAt || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...collectionRoutes];
}