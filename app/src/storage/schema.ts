export const schemaStatements = [
  'PRAGMA foreign_keys = ON;',
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    parent_category_id TEXT,
    color_token TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    currency TEXT NOT NULL,
    balance_minor_units INTEGER NOT NULL,
    base_currency TEXT NOT NULL,
    base_minor_units INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS recurring_rules (
    id TEXT PRIMARY KEY NOT NULL,
    portfolio_id TEXT NOT NULL,
    label TEXT NOT NULL,
    frequency TEXT NOT NULL,
    next_occurrence_at TEXT NOT NULL,
    account_id TEXT NOT NULL,
    category_id TEXT,
    currency TEXT NOT NULL,
    minor_units INTEGER NOT NULL,
    FOREIGN KEY(portfolio_id) REFERENCES portfolios(id),
    FOREIGN KEY(account_id) REFERENCES accounts(id),
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );`,
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    renewal_frequency TEXT NOT NULL,
    next_charge_at TEXT NOT NULL,
    account_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    currency TEXT NOT NULL,
    minor_units INTEGER NOT NULL,
    base_currency TEXT NOT NULL,
    base_minor_units INTEGER NOT NULL,
    FOREIGN KEY(account_id) REFERENCES accounts(id),
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    portfolio_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    account_id TEXT NOT NULL,
    category_id TEXT,
    note TEXT,
    occurred_at TEXT NOT NULL,
    original_currency TEXT NOT NULL,
    original_minor_units INTEGER NOT NULL,
    base_currency TEXT NOT NULL,
    base_minor_units INTEGER NOT NULL,
    fx_base_currency TEXT,
    fx_quote_currency TEXT,
    fx_rate REAL,
    fx_as_of TEXT,
    FOREIGN KEY(portfolio_id) REFERENCES portfolios(id),
    FOREIGN KEY(account_id) REFERENCES accounts(id),
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );`,
  `CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    pricing_currency TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    base_currency TEXT NOT NULL,
    available_cash_minor_units INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS holdings (
    id TEXT PRIMARY KEY NOT NULL,
    portfolio_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    cost_basis_currency TEXT NOT NULL,
    cost_basis_minor_units INTEGER NOT NULL,
    market_value_currency TEXT NOT NULL,
    market_value_minor_units INTEGER NOT NULL,
    FOREIGN KEY(portfolio_id) REFERENCES portfolios(id),
    FOREIGN KEY(asset_id) REFERENCES assets(id)
  );`,
  `CREATE TABLE IF NOT EXISTS passive_income_streams (
    id TEXT PRIMARY KEY NOT NULL,
    portfolio_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    annual_currency TEXT NOT NULL,
    annual_minor_units INTEGER NOT NULL,
    last_paid_at TEXT,
    FOREIGN KEY(portfolio_id) REFERENCES portfolios(id),
    FOREIGN KEY(asset_id) REFERENCES assets(id)
  );`,
  'CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at DESC);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);',
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_next_charge ON subscriptions(next_charge_at);',
  'CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON holdings(portfolio_id);',
  'CREATE INDEX IF NOT EXISTS idx_income_streams_portfolio ON passive_income_streams(portfolio_id);',
] as const;
