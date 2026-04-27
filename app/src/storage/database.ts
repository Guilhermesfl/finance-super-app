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
  }

  return database;
}

async function ensurePortfolioOwnershipColumns(database: SQLite.SQLiteDatabase): Promise<void> {
  const fallbackPortfolioId = await resolveFallbackPortfolioId(database);

  await ensureColumn(database, 'transactions', 'portfolio_id', 'TEXT');
  await ensureColumn(database, 'recurring_rules', 'portfolio_id', 'TEXT');

  await database.runAsync('UPDATE transactions SET portfolio_id = ? WHERE portfolio_id IS NULL;', fallbackPortfolioId);
  await database.runAsync('UPDATE recurring_rules SET portfolio_id = ? WHERE portfolio_id IS NULL;', fallbackPortfolioId);
}

async function resolveFallbackPortfolioId(database: SQLite.SQLiteDatabase): Promise<string> {
  const row = await database.getFirstAsync<{ id: string }>('SELECT id FROM portfolios ORDER BY name ASC LIMIT 1;');

  if (!row?.id) {
    throw new Error('No portfolios are available to assign finance operations.');
  }

  return row.id;
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
