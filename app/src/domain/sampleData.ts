import { formatMoney, money } from './money';
import type { Account, Category, Portfolio, Subscription, Transaction } from './models';

export const categories: Category[] = [
  { id: 'housing', name: 'Housing', colorToken: 'cardA' },
  { id: 'food', name: 'Food', colorToken: 'cardB' },
  { id: 'investing', name: 'Investing', colorToken: 'cardC' },
  { id: 'subscriptions', name: 'Subscriptions', colorToken: 'accentSoft' },
];

export const accounts: Account[] = [
  {
    id: 'wallet-main',
    name: 'Main Wallet',
    kind: 'checking',
    currency: 'EUR',
    currentBalance: money('EUR', 482340),
  },
  {
    id: 'broker-01',
    name: 'Brokerage Cash',
    kind: 'brokerage',
    currency: 'USD',
    currentBalance: money('USD', 128540),
  },
];

export const transactions: Transaction[] = [
  {
    id: 'txn-rent',
    kind: 'expense',
    accountId: 'wallet-main',
    categoryId: 'housing',
    note: 'Rent',
    occurredAt: '2026-04-01',
    originalAmount: money('EUR', -125000),
    baseAmount: money('EUR', -125000),
  },
  {
    id: 'txn-spotify',
    kind: 'expense',
    accountId: 'wallet-main',
    categoryId: 'subscriptions',
    note: 'Spotify',
    occurredAt: '2026-04-07',
    originalAmount: money('EUR', -1199),
    baseAmount: money('EUR', -1199),
  },
  {
    id: 'txn-invest-transfer',
    kind: 'transfer',
    accountId: 'broker-01',
    categoryId: 'investing',
    note: 'Monthly investing allocation',
    occurredAt: '2026-04-08',
    originalAmount: money('USD', 85000),
    baseAmount: money('EUR', 78030),
    fxRate: {
      baseCurrency: 'EUR',
      quoteCurrency: 'USD',
      rate: 0.918,
      asOf: '2026-04-08',
    },
  },
];

export const subscriptions: Subscription[] = [
  {
    id: 'sub-spotify',
    name: 'Spotify Premium',
    renewalFrequency: 'monthly',
    nextChargeAt: '2026-05-07',
    accountId: 'wallet-main',
    categoryId: 'subscriptions',
    amount: money('EUR', 1199),
  },
  {
    id: 'sub-cloud',
    name: 'Cloud Storage',
    renewalFrequency: 'monthly',
    nextChargeAt: '2026-05-14',
    accountId: 'wallet-main',
    categoryId: 'subscriptions',
    amount: money('EUR', 399),
  },
];

export const portfolios: Portfolio[] = [
  {
    id: 'portfolio-global',
    name: 'Global ETFs',
    kind: 'core',
    baseCurrency: 'USD',
    availableCash: money('USD', 48500),
    holdings: [
      {
        id: 'holding-vwra',
        assetId: 'vwra',
        quantity: 42.5,
        costBasis: money('USD', 512340),
        marketValue: money('USD', 566180),
      },
    ],
    passiveIncome: [
      {
        id: 'income-vwra',
        kind: 'dividend',
        assetId: 'vwra',
        annualEstimate: money('USD', 21450),
        lastPaidAt: '2026-03-28',
      },
    ],
  },
  {
    id: 'portfolio-digital',
    name: 'Digital Assets',
    kind: 'crypto',
    baseCurrency: 'USD',
    availableCash: money('USD', 17500),
    holdings: [
      {
        id: 'holding-btc',
        assetId: 'btc',
        quantity: 0.45,
        costBasis: money('USD', 1760000),
        marketValue: money('USD', 2142500),
      },
    ],
    passiveIncome: [],
  },
];

export const sampleMetrics = {
  netCash: formatMoney(money('EUR', 482340)),
  monthlyCommitments: formatMoney(money('EUR', 155870)),
  passiveIncomeAnnual: formatMoney(money('USD', 21450)),
};
