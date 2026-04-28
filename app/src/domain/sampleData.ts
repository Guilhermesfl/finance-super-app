import { money } from './money';
import type { Category, Portfolio } from './models';

export const categories: Category[] = [
  { id: 'housing', name: 'Housing', colorToken: 'cardA' },
  { id: 'food', name: 'Food', colorToken: 'cardB' },
  { id: 'investing', name: 'Investing', colorToken: 'cardC' },
  { id: 'subscriptions', name: 'Subscriptions', colorToken: 'accentSoft' },
];

export const portfolios: Portfolio[] = [
  {
    id: 'portfolio-investments',
    name: 'Investments',
    kind: 'core',
    baseCurrency: 'EUR',
    availableCash: money('EUR', 0),
    holdings: [],
    passiveIncome: [],
  },
  {
    id: 'portfolio-fixed-costs',
    name: 'Fixed Costs',
    kind: 'cash-reserve',
    baseCurrency: 'EUR',
    availableCash: money('EUR', 0),
    holdings: [],
    passiveIncome: [],
  },
];
