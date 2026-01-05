export const SITE_CONFIG = {
  name: "Packon Embalagens",
  whatsapp: {
    number: "5535999521044", // Apenas números
    defaultMessage: "Olá! Vim pelo site da Packon e gostaria de solicitar um orçamento.",
    supportMessage: "Olá! Preciso de ajuda com um pedido da Packon.",
    aboutMessage: "Olá! Gostaria de saber mais sobre a Packon."
  },
  links: {
    instagram: "https://instagram.com/packon", // Coloque o link real se tiver
    linkedin: "https://linkedin.com/company/packon", // Coloque o link real se tiver
  },
  contact: {
    email: "contato@packon.com.br", // Exemplo
  }
};

// Helper para gerar o link do WhatsApp formatado e codificado
export const getWhatsAppLink = (message: string = SITE_CONFIG.whatsapp.defaultMessage) => {
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${SITE_CONFIG.whatsapp.number}?text=${encodedMsg}`;
};