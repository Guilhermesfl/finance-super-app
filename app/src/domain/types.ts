export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'BRL'
  | 'JPY'
  | 'BTC'
  | 'ETH';

export type EntryDirection = 'inflow' | 'outflow';

export type AccountKind = 'cash' | 'checking' | 'savings' | 'credit' | 'brokerage' | 'crypto-wallet';

export type PortfolioKind = 'core' | 'income' | 'crypto' | 'cash-reserve';

export type AssetKind = 'stock' | 'etf' | 'mutual-fund' | 'bond' | 'crypto' | 'cash';

export type IncomeKind = 'salary' | 'dividend' | 'coupon' | 'interest' | 'other';

export type TransactionKind =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'buy'
  | 'sell'
  | 'fee'
  | 'dividend'
  | 'interest';

export type RecurrenceFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
