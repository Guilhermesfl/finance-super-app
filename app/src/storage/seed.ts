import { categories, portfolios } from '../domain/sampleData';
import type { AppDatabase } from './database';

const baseCurrency = 'EUR';

export async function seedDatabase(database: AppDatabase): Promise<void> {
  await database.execAsync('BEGIN TRANSACTION;');

  try {
    await database.runAsync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?), (?, ?);',
      'base_currency',
      baseCurrency,
      'seed_version',
      '2'
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

    for (const portfolio of portfolios) {
      await database.runAsync(
        'INSERT OR REPLACE INTO portfolios (id, name, kind, base_currency, available_cash_minor_units) VALUES (?, ?, ?, ?, ?);',
        portfolio.id,
        portfolio.name,
        portfolio.kind,
        portfolio.baseCurrency,
        portfolio.availableCash.minorUnits
      );
    }

    await database.execAsync('COMMIT;');
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    throw error;
  }
}
