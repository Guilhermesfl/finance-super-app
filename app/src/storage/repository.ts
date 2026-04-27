import { formatMoney, money } from '../domain/money';
import type {
  Account,
  Asset,
  Category,
  Holding,
  PassiveIncomeStream,
  Portfolio,
  RecurringRule,
  Subscription,
  Transaction,
} from '../domain/models';
import type {
  AccountKind,
  AssetKind,
  CurrencyCode,
  IncomeKind,
  PortfolioKind,
  RecurrenceFrequency,
  TransactionKind,
} from '../domain/types';
import { getDatabase } from './database';

interface CategoryRow {
  id: string;
  name: string;
  parent_category_id: string | null;
  color_token: string;
}

interface AccountRow {
  id: string;
  name: string;
  kind: AccountKind;
  currency: CurrencyCode;
  balance_minor_units: number;
  base_currency: CurrencyCode;
  base_minor_units: number;
}

interface RecurringRuleRow {
  id: string;
  portfolio_id: string;
  label: string;
  frequency: RecurrenceFrequency;
  next_occurrence_at: string;
  account_id: string;
  category_id: string | null;
  currency: CurrencyCode;
  minor_units: number;
}

interface SubscriptionRow {
  id: string;
  name: string;
  renewal_frequency: RecurrenceFrequency;
  next_charge_at: string;
  account_id: string;
  category_id: string;
  currency: CurrencyCode;
  minor_units: number;
  base_currency: CurrencyCode;
  base_minor_units: number;
}

interface TransactionRow {
  id: string;
  portfolio_id: string;
  kind: TransactionKind;
  account_id: string;
  category_id: string | null;
  note: string | null;
  occurred_at: string;
  original_currency: CurrencyCode;
  original_minor_units: number;
  base_currency: CurrencyCode;
  base_minor_units: number;
  fx_base_currency: CurrencyCode | null;
  fx_quote_currency: CurrencyCode | null;
  fx_rate: number | null;
  fx_as_of: string | null;
}

interface AssetRow {
  id: string;
  symbol: string;
  name: string;
  kind: AssetKind;
  pricing_currency: CurrencyCode;
}

interface PortfolioRow {
  id: string;
  name: string;
  kind: PortfolioKind;
  base_currency: CurrencyCode;
  available_cash_minor_units: number;
}

interface HoldingRow {
  id: string;
  portfolio_id: string;
  asset_id: string;
  quantity: number;
  cost_basis_currency: CurrencyCode;
  cost_basis_minor_units: number;
  market_value_currency: CurrencyCode;
  market_value_minor_units: number;
}

interface PassiveIncomeRow {
  id: string;
  portfolio_id: string;
  kind: IncomeKind;
  asset_id: string;
  annual_currency: CurrencyCode;
  annual_minor_units: number;
  last_paid_at: string | null;
}

interface SettingRow {
  value: string;
}

export interface DashboardSnapshot {
  baseCurrency: CurrencyCode;
  categories: Category[];
  accounts: Account[];
  recurringRules: RecurringRule[];
  subscriptions: Subscription[];
  transactions: Transaction[];
  assets: Asset[];
  portfolios: Portfolio[];
  metrics: {
    netCash: string;
    monthlyCommitments: string;
    passiveIncomeAnnual: string;
  };
}

export interface CreateCategoryInput {
  name: string;
  colorToken: string;
  parentCategoryId?: string;
}

export interface CreateTransactionInput {
  portfolioId: string;
  kind: Extract<TransactionKind, 'expense' | 'income'>;
  accountId: string;
  categoryId?: string;
  note?: string;
  occurredAt: string;
  originalMinorUnits: number;
  baseMinorUnits: number;
}

export interface CreateRecurringRuleInput {
  portfolioId: string;
  label: string;
  frequency: RecurrenceFrequency;
  nextOccurrenceAt: string;
  accountId: string;
  categoryId?: string;
  minorUnits: number;
}

export interface CreateTransferInput {
  portfolioId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amountInSourceCurrency: number;
  occurredAt: string;
  note?: string;
}

export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  const database = await getDatabase();

  const settingsRow = await database.getFirstAsync<SettingRow>('SELECT value FROM app_settings WHERE key = ?;', 'base_currency');
  const categoryRows = (await database.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY name ASC;')) as CategoryRow[];
  const accountRows = (await database.getAllAsync<AccountRow>('SELECT * FROM accounts ORDER BY name ASC;')) as AccountRow[];
  const ruleRows = (await database.getAllAsync<RecurringRuleRow>(
    'SELECT * FROM recurring_rules ORDER BY next_occurrence_at ASC;'
  )) as RecurringRuleRow[];
  const subscriptionRows = (await database.getAllAsync<SubscriptionRow>(
    'SELECT * FROM subscriptions ORDER BY next_charge_at ASC;'
  )) as SubscriptionRow[];
  const transactionRows = (await database.getAllAsync<TransactionRow>(
    'SELECT * FROM transactions ORDER BY occurred_at DESC;'
  )) as TransactionRow[];
  const assetRows = (await database.getAllAsync<AssetRow>('SELECT * FROM assets ORDER BY symbol ASC;')) as AssetRow[];
  const portfolioRows = (await database.getAllAsync<PortfolioRow>('SELECT * FROM portfolios ORDER BY name ASC;')) as PortfolioRow[];
  const holdingRows = (await database.getAllAsync<HoldingRow>('SELECT * FROM holdings ORDER BY portfolio_id ASC;')) as HoldingRow[];
  const incomeRows = (await database.getAllAsync<PassiveIncomeRow>(
    'SELECT * FROM passive_income_streams ORDER BY portfolio_id ASC;'
  )) as PassiveIncomeRow[];

  const baseCurrency = (settingsRow?.value as CurrencyCode | undefined) ?? 'EUR';
  const categories = categoryRows.map(mapCategoryRow);
  const accounts = accountRows.map(mapAccountRow);
  const recurringRules = ruleRows.map(mapRecurringRuleRow);
  const subscriptions = subscriptionRows.map(mapSubscriptionRow);
  const transactions = transactionRows.map(mapTransactionRow);
  const assets = assetRows.map(mapAssetRow);
  const holdingsByPortfolioId = groupBy(holdingRows.map(mapHoldingRow), (holding) => holding.portfolioId);
  const incomeByPortfolioId = groupBy(incomeRows.map(mapPassiveIncomeRow), (stream) => stream.portfolioId);
  const portfolios = portfolioRows.map((row: PortfolioRow) =>
    mapPortfolioRow(row, holdingsByPortfolioId.get(row.id) ?? [], incomeByPortfolioId.get(row.id) ?? [])
  );

  const netCashMinorUnits = accountRows.reduce((sum: number, row: AccountRow) => sum + row.base_minor_units, 0);
  const monthlyCommitmentsMinorUnits = subscriptionRows.reduce(
    (sum: number, row: SubscriptionRow) => sum + row.base_minor_units,
    0
  );
  const passiveIncomeAnnualMinorUnits = incomeRows.reduce((sum: number, row: PassiveIncomeRow) => {
    if (row.annual_currency === baseCurrency) {
      return sum + row.annual_minor_units;
    }

    return sum;
  }, 0);

  return {
    baseCurrency,
    categories,
    accounts,
    recurringRules,
    subscriptions,
    transactions,
    assets,
    portfolios,
    metrics: {
      netCash: formatMoney(money(baseCurrency, netCashMinorUnits)),
      monthlyCommitments: formatMoney(money(baseCurrency, monthlyCommitmentsMinorUnits)),
      passiveIncomeAnnual: formatMoney(money(baseCurrency, passiveIncomeAnnualMinorUnits)),
    },
  };
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const database = await getDatabase();
  const normalizedName = input.name.trim();

  if (!normalizedName) {
    throw new Error('Category name is required.');
  }

  const id = createEntityId('category');
  await database.runAsync(
    'INSERT INTO categories (id, name, parent_category_id, color_token) VALUES (?, ?, ?, ?);',
    id,
    normalizedName,
    input.parentCategoryId ?? null,
    input.colorToken
  );

  return {
    id,
    name: normalizedName,
    parentCategoryId: input.parentCategoryId,
    colorToken: input.colorToken,
  };
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const database = await getDatabase();
  await assertPortfolioExists(database, input.portfolioId);
  const accountRow = await database.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?;', input.accountId);

  if (!accountRow) {
    throw new Error('Selected account was not found.');
  }

  const note = input.note?.trim();
  const id = createEntityId('txn');
  const signedOriginalMinorUnits = input.kind === 'expense' ? input.originalMinorUnits * -1 : input.originalMinorUnits;
  const signedBaseMinorUnits = input.kind === 'expense' ? input.baseMinorUnits * -1 : input.baseMinorUnits;

  await database.execAsync('BEGIN TRANSACTION;');

  try {
    await database.runAsync(
      `INSERT INTO transactions (
        id, portfolio_id, kind, account_id, category_id, note, occurred_at, original_currency, original_minor_units,
        base_currency, base_minor_units, fx_base_currency, fx_quote_currency, fx_rate, fx_as_of
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      id,
      input.portfolioId,
      input.kind,
      input.accountId,
      input.categoryId ?? null,
      note ?? null,
      input.occurredAt,
      accountRow.currency,
      signedOriginalMinorUnits,
      accountRow.base_currency,
      signedBaseMinorUnits,
      accountRow.base_currency !== accountRow.currency ? accountRow.base_currency : null,
      accountRow.base_currency !== accountRow.currency ? accountRow.currency : null,
      accountRow.base_currency !== accountRow.currency && signedOriginalMinorUnits !== 0
        ? Math.abs(signedBaseMinorUnits / signedOriginalMinorUnits)
        : null,
      accountRow.base_currency !== accountRow.currency ? input.occurredAt : null
    );

    await database.runAsync(
      `UPDATE accounts
       SET balance_minor_units = balance_minor_units + ?,
           base_minor_units = base_minor_units + ?
       WHERE id = ?;`,
      signedOriginalMinorUnits,
      signedBaseMinorUnits,
      input.accountId
    );

    await database.execAsync('COMMIT;');
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    throw error;
  }

  return {
    id,
    portfolioId: input.portfolioId,
    kind: input.kind,
    accountId: input.accountId,
    categoryId: input.categoryId,
    note,
    occurredAt: input.occurredAt,
    originalAmount: money(accountRow.currency, signedOriginalMinorUnits),
    baseAmount: money(accountRow.base_currency, signedBaseMinorUnits),
    fxRate:
      accountRow.base_currency !== accountRow.currency && signedOriginalMinorUnits !== 0
        ? {
            baseCurrency: accountRow.base_currency,
            quoteCurrency: accountRow.currency,
            rate: Math.abs(signedBaseMinorUnits / signedOriginalMinorUnits),
            asOf: input.occurredAt,
          }
        : undefined,
  };
}

export async function createRecurringRule(input: CreateRecurringRuleInput): Promise<RecurringRule> {
  const database = await getDatabase();
  await assertPortfolioExists(database, input.portfolioId);
  const accountRow = await database.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?;', input.accountId);

  if (!accountRow) {
    throw new Error('Selected account was not found.');
  }

  const label = input.label.trim();

  if (!label) {
    throw new Error('Recurring label is required.');
  }

  const id = createEntityId('rule');
  await database.runAsync(
    `INSERT INTO recurring_rules (
      id, portfolio_id, label, frequency, next_occurrence_at, account_id, category_id, currency, minor_units
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    id,
    input.portfolioId,
    label,
    input.frequency,
    input.nextOccurrenceAt,
    input.accountId,
    input.categoryId ?? null,
    accountRow.currency,
    input.minorUnits
  );

  return {
    id,
    portfolioId: input.portfolioId,
    label,
    frequency: input.frequency,
    nextOccurrenceAt: input.nextOccurrenceAt,
    accountId: input.accountId,
    categoryId: input.categoryId,
    amount: money(accountRow.currency, input.minorUnits),
  };
}

export async function createTransfer(input: CreateTransferInput): Promise<{ sourceId: string; destinationId: string }> {
  const database = await getDatabase();
  await assertPortfolioExists(database, input.portfolioId);
  const sourceRow = await database.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?;', input.sourceAccountId);
  const destRow = await database.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?;', input.destinationAccountId);

  if (!sourceRow) {
    throw new Error('Source account was not found.');
  }

  if (!destRow) {
    throw new Error('Destination account was not found.');
  }

  if (input.amountInSourceCurrency <= 0) {
    throw new Error('Transfer amount must be positive.');
  }

  const note = input.note?.trim() ?? `Transfer to ${destRow.name}`;
  const sourceId = createEntityId('xfer');
  const destId = createEntityId('xfer');

  let destMinorUnits = input.amountInSourceCurrency;
  let fxRate: number | null = null;

  if (sourceRow.currency !== destRow.currency) {
    fxRate = 1;
    destMinorUnits = input.amountInSourceCurrency;
  }

  await database.execAsync('BEGIN TRANSACTION;');

  try {
    await database.runAsync(
      `INSERT INTO transactions (
        id, portfolio_id, kind, account_id, category_id, note, occurred_at, original_currency, original_minor_units,
        base_currency, base_minor_units, fx_base_currency, fx_quote_currency, fx_rate, fx_as_of
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      sourceId,
      input.portfolioId,
      'transfer',
      input.sourceAccountId,
      null,
      note,
      input.occurredAt,
      sourceRow.currency,
      -input.amountInSourceCurrency,
      sourceRow.base_currency,
      -input.amountInSourceCurrency,
      null,
      null,
      null,
      null
    );

    await database.runAsync(
      `INSERT INTO transactions (
        id, portfolio_id, kind, account_id, category_id, note, occurred_at, original_currency, original_minor_units,
        base_currency, base_minor_units, fx_base_currency, fx_quote_currency, fx_rate, fx_as_of
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      destId,
      input.portfolioId,
      'transfer',
      input.destinationAccountId,
      null,
      note,
      input.occurredAt,
      destRow.currency,
      destMinorUnits,
      destRow.base_currency,
      destMinorUnits,
      sourceRow.currency !== destRow.currency ? sourceRow.currency : null,
      sourceRow.currency !== destRow.currency ? destRow.currency : null,
      fxRate,
      sourceRow.currency !== destRow.currency ? input.occurredAt : null
    );

    await database.runAsync(
      `UPDATE accounts
       SET balance_minor_units = balance_minor_units - ?,
           base_minor_units = base_minor_units - ?
       WHERE id = ?;`,
      input.amountInSourceCurrency,
      input.amountInSourceCurrency,
      input.sourceAccountId
    );

    await database.runAsync(
      `UPDATE accounts
       SET balance_minor_units = balance_minor_units + ?,
           base_minor_units = base_minor_units + ?
       WHERE id = ?;`,
      destMinorUnits,
      destMinorUnits,
      input.destinationAccountId
    );

    await database.execAsync('COMMIT;');
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    throw error;
  }

  return { sourceId, destinationId: destId };
}

function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    parentCategoryId: row.parent_category_id ?? undefined,
    colorToken: row.color_token,
  };
}

function mapAccountRow(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    currency: row.currency,
    currentBalance: money(row.currency, row.balance_minor_units),
  };
}

function mapRecurringRuleRow(row: RecurringRuleRow): RecurringRule {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    label: row.label,
    frequency: row.frequency,
    nextOccurrenceAt: row.next_occurrence_at,
    accountId: row.account_id,
    categoryId: row.category_id ?? undefined,
    amount: money(row.currency, row.minor_units),
  };
}

function mapSubscriptionRow(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    renewalFrequency: row.renewal_frequency,
    nextChargeAt: row.next_charge_at,
    accountId: row.account_id,
    categoryId: row.category_id,
    amount: money(row.currency, row.minor_units),
  };
}

function mapTransactionRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    kind: row.kind,
    accountId: row.account_id,
    categoryId: row.category_id ?? undefined,
    note: row.note ?? undefined,
    occurredAt: row.occurred_at,
    originalAmount: money(row.original_currency, row.original_minor_units),
    baseAmount: money(row.base_currency, row.base_minor_units),
    fxRate:
      row.fx_base_currency && row.fx_quote_currency && row.fx_rate && row.fx_as_of
        ? {
            baseCurrency: row.fx_base_currency,
            quoteCurrency: row.fx_quote_currency,
            rate: row.fx_rate,
            asOf: row.fx_as_of,
          }
        : undefined,
  };
}

function mapAssetRow(row: AssetRow): Asset {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    kind: row.kind,
    pricingCurrency: row.pricing_currency,
  };
}

function mapHoldingRow(row: HoldingRow): Holding & { portfolioId: string } {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    assetId: row.asset_id,
    quantity: row.quantity,
    costBasis: money(row.cost_basis_currency, row.cost_basis_minor_units),
    marketValue: money(row.market_value_currency, row.market_value_minor_units),
  };
}

function mapPassiveIncomeRow(row: PassiveIncomeRow): PassiveIncomeStream & { portfolioId: string } {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    kind: row.kind,
    assetId: row.asset_id,
    annualEstimate: money(row.annual_currency, row.annual_minor_units),
    lastPaidAt: row.last_paid_at ?? undefined,
  };
}

function mapPortfolioRow(
  row: PortfolioRow,
  holdings: Array<Holding & { portfolioId: string }>,
  passiveIncome: Array<PassiveIncomeStream & { portfolioId: string }>
): Portfolio {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    baseCurrency: row.base_currency,
    availableCash: money(row.base_currency, row.available_cash_minor_units),
    holdings: holdings.map(({ portfolioId: _portfolioId, ...holding }) => holding),
    passiveIncome: passiveIncome.map(({ portfolioId: _portfolioId, ...stream }) => stream),
  };
}

function groupBy<TItem, TKey>(items: TItem[], getKey: (item: TItem) => TKey): Map<TKey, TItem[]> {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    const bucket = groups.get(key);

    if (bucket) {
      bucket.push(item);
      return groups;
    }

    groups.set(key, [item]);
    return groups;
  }, new Map<TKey, TItem[]>());
}

function createEntityId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function assertPortfolioExists(database: Awaited<ReturnType<typeof getDatabase>>, portfolioId: string): Promise<void> {
  const row = await database.getFirstAsync<{ id: string }>('SELECT id FROM portfolios WHERE id = ?;', portfolioId);

  if (!row?.id) {
    throw new Error('Selected portfolio was not found.');
  }
}
