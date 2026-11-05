export function splitCommission(price: number, ratePercent: number) {
  const commission = Math.round(price * ratePercent) / 100;
  return { commission, providerNet: Math.round((price - commission) * 100) / 100 };
}
