import type {
  AccountKind,
  AssetKind,
  CurrencyCode,
  IncomeKind,
  PortfolioKind,
  RecurrenceFrequency,
  TransactionKind,
} from './types';
import type { FxRate, MoneyAmount } from './money';

export interface Category {
  id: string;
  name: string;
  parentCategoryId?: string;
  colorToken: string;
}

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  currency: CurrencyCode;
  currentBalance: MoneyAmount;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  kind: TransactionKind;
  accountId: string;
  categoryId?: string;
  note?: string;
  occurredAt: string;
  originalAmount: MoneyAmount;
  baseAmount: MoneyAmount;
  fxRate?: FxRate;
}

export interface RecurringRule {
  id: string;
  portfolioId: string;
  label: string;
  frequency: RecurrenceFrequency;
  nextOccurrenceAt: string;
  accountId: string;
  categoryId?: string;
  amount: MoneyAmount;
}

export interface Subscription {
  id: string;
  name: string;
  renewalFrequency: RecurrenceFrequency;
  nextChargeAt: string;
  accountId: string;
  categoryId: string;
  amount: MoneyAmount;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  kind: AssetKind;
  pricingCurrency: CurrencyCode;
}

export interface Holding {
  id: string;
  assetId: string;
  quantity: number;
  costBasis: MoneyAmount;
  marketValue: MoneyAmount;
}

export interface PassiveIncomeStream {
  id: string;
  kind: IncomeKind;
  assetId: string;
  annualEstimate: MoneyAmount;
  lastPaidAt?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  kind: PortfolioKind;
  baseCurrency: CurrencyCode;
  availableCash: MoneyAmount;
  holdings: Holding[];
  passiveIncome: PassiveIncomeStream[];
}
