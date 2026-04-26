import { accounts, categories, portfolios, subscriptions, transactions } from '../domain/sampleData';
import { money } from '../domain/money';
import type { Asset, RecurringRule } from '../domain/models';
import type { AppDatabase } from './database';

const baseCurrency = 'EUR';

const assets: Asset[] = [
  {
    id: 'vwra',
    symbol: 'VWRA',
    name: 'Vanguard FTSE All-World UCITS ETF',
    kind: 'etf',
    pricingCurrency: 'USD',
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    kind: 'crypto',
    pricingCurrency: 'USD',
  },
];

const recurringRules: RecurringRule[] = [
  {
    id: 'rule-rent',
    label: 'Monthly rent',
    frequency: 'monthly',
    nextOccurrenceAt: '2026-05-01',
    accountId: 'wallet-main',
    categoryId: 'housing',
    amount: money('EUR', 125000),
  },
  {
    id: 'rule-investing',
    label: 'Investing allocation',
    frequency: 'monthly',
    nextOccurrenceAt: '2026-05-08',
    accountId: 'broker-01',
    categoryId: 'investing',
    amount: money('USD', 85000),
  },
];

export async function seedDatabase(database: AppDatabase): Promise<void> {
  await database.execAsync('BEGIN TRANSACTION;');

  try {
    await database.runAsync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?), (?, ?);',
      'base_currency',
      baseCurrency,
      'seed_version',
      '1'
    );

    for (const category of categories) {
      await database.runAsync(
        'INSERT OR REPLACE INTO categories (id, name, parent_category_id, color_token) VALUES (?, ?, ?, ?);',
        category.id,
        category.name,
        category.parentCategoryId ?? null,
        category.colorToken
      );
    }

    for (const account of accounts) {
      const baseMinorUnits = account.currency === 'USD' ? 118040 : account.currentBalance.minorUnits;
      await database.runAsync(
        `INSERT OR REPLACE INTO accounts (
          id, name, kind, currency, balance_minor_units, base_currency, base_minor_units
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        account.id,
        account.name,
        account.kind,
        account.currency,
        account.currentBalance.minorUnits,
        baseCurrency,
        baseMinorUnits
      );
    }

    for (const rule of recurringRules) {
      await database.runAsync(
        `INSERT OR REPLACE INTO recurring_rules (
          id, label, frequency, next_occurrence_at, account_id, category_id, currency, minor_units
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        rule.id,
        rule.label,
        rule.frequency,
        rule.nextOccurrenceAt,
        rule.accountId,
        rule.categoryId ?? null,
        rule.amount.currency,
        rule.amount.minorUnits
      );
    }

    for (const subscription of subscriptions) {
      await database.runAsync(
        `INSERT OR REPLACE INTO subscriptions (
          id, name, renewal_frequency, next_charge_at, account_id, category_id, currency, minor_units, base_currency, base_minor_units
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        subscription.id,
        subscription.name,
        subscription.renewalFrequency,
        subscription.nextChargeAt,
        subscription.accountId,
        subscription.categoryId,
        subscription.amount.currency,
        subscription.amount.minorUnits,
        baseCurrency,
        subscription.amount.minorUnits
      );
    }

    for (const transaction of transactions) {
      await database.runAsync(
        `INSERT OR REPLACE INTO transactions (
          id, kind, account_id, category_id, note, occurred_at, original_currency, original_minor_units,
          base_currency, base_minor_units, fx_base_currency, fx_quote_currency, fx_rate, fx_as_of
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        transaction.id,
        transaction.kind,
        transaction.accountId,
        transaction.categoryId ?? null,
        transaction.note ?? null,
        transaction.occurredAt,
        transaction.originalAmount.currency,
        transaction.originalAmount.minorUnits,
        transaction.baseAmount.currency,
        transaction.baseAmount.minorUnits,
        transaction.fxRate?.baseCurrency ?? null,
        transaction.fxRate?.quoteCurrency ?? null,
        transaction.fxRate?.rate ?? null,
        transaction.fxRate?.asOf ?? null
      );
    }

    for (const asset of assets) {
      await database.runAsync(
        'INSERT OR REPLACE INTO assets (id, symbol, name, kind, pricing_currency) VALUES (?, ?, ?, ?, ?);',
        asset.id,
        asset.symbol,
        asset.name,
        asset.kind,
        asset.pricingCurrency
      );
    }

    for (const portfolio of portfolios) {
      await database.runAsync(
        'INSERT OR REPLACE INTO portfolios (id, name, kind, base_currency, available_cash_minor_units) VALUES (?, ?, ?, ?, ?);',
        portfolio.id,
        portfolio.name,
        portfolio.kind,
        portfolio.baseCurrency,
        portfolio.availableCash.minorUnits
      );

      for (const holding of portfolio.holdings) {
        await database.runAsync(
          `INSERT OR REPLACE INTO holdings (
            id, portfolio_id, asset_id, quantity, cost_basis_currency, cost_basis_minor_units, market_value_currency, market_value_minor_units
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          holding.id,
          portfolio.id,
          holding.assetId,
          holding.quantity,
          holding.costBasis.currency,
          holding.costBasis.minorUnits,
          holding.marketValue.currency,
          holding.marketValue.minorUnits
        );
      }

      for (const income of portfolio.passiveIncome) {
        await database.runAsync(
          `INSERT OR REPLACE INTO passive_income_streams (
            id, portfolio_id, kind, asset_id, annual_currency, annual_minor_units, last_paid_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
          income.id,
          portfolio.id,
          income.kind,
          income.assetId,
          income.annualEstimate.currency,
          income.annualEstimate.minorUnits,
          income.lastPaidAt ?? null
        );
      }
    }

    await database.execAsync('COMMIT;');
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    throw error;
  }
}
