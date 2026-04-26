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

  const settingsRow = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?;',
    'seed_version'
  );

  if (!settingsRow) {
    await seedDatabase(database);
  }

  return database;
}
