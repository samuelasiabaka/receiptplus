import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

let dbInstance: SQLiteDatabase | null = null;

export const getDb = (): SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = openDatabaseSync('receipts.db');
  }
  return dbInstance;
};

/**
 * Initialize the database schema.
 * Uses the new expo-sqlite API with execAsync.
 */
export const initDb = async () => {
  const db = getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receiptNumber TEXT NOT NULL UNIQUE,
      total REAL NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS receipt_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receiptId INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (receiptId) REFERENCES receipts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS business_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      cacNumber TEXT,
      logoUri TEXT
    );
  `);
};

