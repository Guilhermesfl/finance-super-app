import type { CurrencyCode } from './types';

export interface MoneyAmount {
  currency: CurrencyCode;
  minorUnits: number;
}

export interface FxRate {
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
  rate: number;
  asOf: string;
}

export function money(currency: CurrencyCode, minorUnits: number): MoneyAmount {
  if (!Number.isInteger(minorUnits)) {
    throw new Error('Money must be stored in integer minor units.');
  }

  return { currency, minorUnits };
}

export function addMoney(left: MoneyAmount, right: MoneyAmount): MoneyAmount {
  if (left.currency !== right.currency) {
    throw new Error('Cannot add money values from different currencies.');
  }

  return money(left.currency, left.minorUnits + right.minorUnits);
}

export function negateMoney(amount: MoneyAmount): MoneyAmount {
  const negated = amount.minorUnits * -1;
  // Avoid -0 in financial calculations
  return money(amount.currency, negated === 0 ? 0 : negated);
}

export function formatMoney(amount: MoneyAmount, locale = 'en-US'): string {
  const scale = amount.currency === 'JPY' ? 1 : 100;
  const value = amount.minorUnits / scale;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: amount.currency,
    maximumFractionDigits: amount.currency === 'JPY' ? 0 : 2,
  }).format(value);
}
