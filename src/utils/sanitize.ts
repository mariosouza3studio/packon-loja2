// src/utils/sanitize.ts
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitiza strings HTML para prevenir ataques XSS (Cross-site Scripting).
 * Configurado para permitir tags de formatação básicas vindas da Shopify,
 * mas remover scripts, iframes perigosos e atributos de evento (onclick, etc).
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true }, // Permite apenas HTML seguro
    ADD_ATTR: ['target', 'rel'],  // Permite target="_blank" em links
  });
};