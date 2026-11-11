// Consent for NON-essential storage (advertising). Essential storage (login session, theme) needs none.
// Nothing here runs unless FEATURES.ads is switched on.
const KEY = 'pf-consent-v1';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };

export const getConsent = () => read(); // {ads:boolean, at:number} | null (not decided yet)
export const hasAdConsent = () => read()?.ads === true;
export const setConsent = (ads) => {
  try { localStorage.setItem(KEY, JSON.stringify({ ads: !!ads, at: Date.now() })); } catch (e) { /* storage blocked */ }
  window.dispatchEvent(new Event('pf-consent'));
};
export const resetConsent = () => { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } window.dispatchEvent(new Event('pf-consent')); };
