import * as SQLite from 'expo-sqlite';

import { schemaStatements } from './schema';
import { seedDatabase } from './seed';

const DATABASE_NAME = 'finance-super-app.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

export type AppDatabase = SQLite.SQLiteDatabase;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = initializeDatabase();
  }

  return databasePromise;
}

async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);

  for (const statement of schemaStatements) {
    await database.execAsync(statement);
  }

  await ensurePortfolioOwnershipColumns(database);

  const settingsRow = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?;',
    'seed_version'
  );

  if (!settingsRow) {
    await seedDatabase(database);
  } else if (settingsRow.value === '1') {
    await migrateV1toV2(database);
  }

  return database;
}

async function migrateV1toV2(database: SQLite.SQLiteDatabase): Promise<void> {
  const investmentsPortfolioId = 'portfolio-investments';
  const fixedCostsPortfolioId = 'portfolio-fixed-costs';

  await database.execAsync('BEGIN TRANSACTION;');

  try {
    await database.runAsync(
      'INSERT OR REPLACE INTO portfolios (id, name, kind, base_currency, available_cash_minor_units) VALUES (?, ?, ?, ?, ?);',
      investmentsPortfolioId,
      'Investments',
      'core',
      'EUR',
      0
    );

    await database.runAsync(
      'INSERT OR REPLACE INTO portfolios (id, name, kind, base_currency, available_cash_minor_units) VALUES (?, ?, ?, ?, ?);',
      fixedCostsPortfolioId,
      'Fixed Costs',
      'cash-reserve',
      'EUR',
      0
    );

    await database.runAsync(
      'UPDATE transactions SET portfolio_id = ? WHERE portfolio_id IS NULL OR portfolio_id NOT IN (?, ?);',
      investmentsPortfolioId,
      investmentsPortfolioId,
      fixedCostsPortfolioId
    );

    await database.runAsync(
      'UPDATE recurring_rules SET portfolio_id = ? WHERE portfolio_id IS NULL OR portfolio_id NOT IN (?, ?);',
      fixedCostsPortfolioId,
      investmentsPortfolioId,
      fixedCostsPortfolioId
    );

    await database.runAsync(
      'UPDATE holdings SET portfolio_id = ? WHERE portfolio_id IS NULL OR portfolio_id NOT IN (?, ?);',
      investmentsPortfolioId,
      investmentsPortfolioId,
      fixedCostsPortfolioId
    );

    await database.runAsync(
      'UPDATE passive_income_streams SET portfolio_id = ? WHERE portfolio_id IS NULL OR portfolio_id NOT IN (?, ?);',
      investmentsPortfolioId,
      investmentsPortfolioId,
      fixedCostsPortfolioId
    );

    await database.runAsync(
      'DELETE FROM portfolios WHERE id NOT IN (?, ?);',
      investmentsPortfolioId,
      fixedCostsPortfolioId
    );

    await database.runAsync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);',
      'seed_version',
      '2'
    );

    await database.execAsync('COMMIT;');
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    throw error;
  }
}

async function ensurePortfolioOwnershipColumns(database: SQLite.SQLiteDatabase): Promise<void> {
  await ensureColumn(database, 'transactions', 'portfolio_id', 'TEXT');
  await ensureColumn(database, 'recurring_rules', 'portfolio_id', 'TEXT');

  const fallbackPortfolioId = await resolveFallbackPortfolioId(database);

  if (fallbackPortfolioId) {
    await database.runAsync('UPDATE transactions SET portfolio_id = ? WHERE portfolio_id IS NULL;', fallbackPortfolioId);
    await database.runAsync('UPDATE recurring_rules SET portfolio_id = ? WHERE portfolio_id IS NULL;', fallbackPortfolioId);
  }
}

async function resolveFallbackPortfolioId(database: SQLite.SQLiteDatabase): Promise<string | null> {
  const row = await database.getFirstAsync<{ id: string }>('SELECT id FROM portfolios ORDER BY name ASC LIMIT 1;');

  return row?.id ?? null;
}

async function ensureColumn(
  database: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
  columnDefinition: string
): Promise<void> {
  const columns = (await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName});`)) as Array<{ name: string }>;

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  await database.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`);
}
