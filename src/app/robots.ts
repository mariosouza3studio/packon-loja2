import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/private/'], // Protege rotas internas
    },
    sitemap: 'https://packon.com.br/sitemap.xml', // Ajuste para seu domínio final
  };
}