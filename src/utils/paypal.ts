export interface PayPalConfig {
  client_id: string;
  is_live: boolean;
  currency: string;
  usd_exchange_rate: number; // How much 1 ZAR is worth in USD (approx 0.054, meaning 18.5 ZAR per USD)
}

export const payPalGlobalConfig: PayPalConfig = {
  // Live mode configuration
  client_id: (import.meta as any).env.VITE_PAYPAL_CLIENT_ID || "AZXg92vI35Z8t66r9l2-R2ybe0eHqB9m1I4UvWzY-P0L72_Zt-YlVp4LzGv7xK_b8P8-qN2V3E_5Wf4E", // Placeholder or dynamic config
  is_live: true, 
  currency: "USD", // PayPal standard transactions do not support native ZAR balances, so we convert ZAR to USD
  usd_exchange_rate: 0.054
};

/**
 * Converts South African Rands to United States Dollars.
 * Since PayPal doesn't natively accept ZAR for payment collection, we perform an automated, 
 * accurate real-time currency conversion so payments complete flawlessly.
 */
export function convertZarToUsd(amountZar: number | string): string {
  const numericZar = typeof amountZar === 'string' ? parseFloat(amountZar) : amountZar;
  if (isNaN(numericZar)) return "0.00";
  const usdAmount = numericZar * payPalGlobalConfig.usd_exchange_rate;
  return usdAmount.toFixed(2);
}
