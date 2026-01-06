export const dynamic = 'force-static';
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://packon.com.br"; // Garanta que este domínio está correto

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Bloqueamos rotas de API internas e parâmetros de busca para não gastar "crawl budget" do Google
      disallow: ['/api/', '/cart', '/account', '/*?*'], 
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}