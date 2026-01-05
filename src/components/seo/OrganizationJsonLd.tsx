import { SITE_CONFIG } from "@/config/site";

export default function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Packon Embalagens",
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://packon.com.br",
    "logo": "https://packon.com.br/logo-seo.png", // Certifique-se de ter uma logo quadrada/retangular na public
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": `+${SITE_CONFIG.whatsapp.number}`,
      "contactType": "customer service",
      "areaServed": "BR",
      "availableLanguage": "Portuguese"
    },
    "sameAs": [
      // Adicione as redes sociais reais da Packon aqui se tiver
      "https://instagram.com/packonembalagens", 
      "https://linkedin.com/company/packon"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "BR"
      // Se tiver endereço físico público, adicione:
      // "addressLocality": "Cidade",
      // "addressRegion": "UF"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}