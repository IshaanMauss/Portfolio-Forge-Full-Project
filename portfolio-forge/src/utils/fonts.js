// Fonts offered for the generated portfolio (loaded from Google Fonts in the preview/public page).
export const PORTFOLIO_FONTS = {
  Poppins: 'Poppins:wght@400;600;700',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;600;700',
  'Space Grotesk': 'Space+Grotesk:wght@400;600;700',
  Inter: 'Inter:wght@400;600;700',
  'Playfair Display': 'Playfair+Display:wght@400;700',
  'DM Serif Display': 'DM+Serif+Display',
  'Roboto Slab': 'Roboto+Slab:wght@400;700',
  Lato: 'Lato:wght@400;700',
};
export const DEFAULT_FONT = 'Poppins';
export const fontQuery = (font) => PORTFOLIO_FONTS[font] || PORTFOLIO_FONTS[DEFAULT_FONT];
