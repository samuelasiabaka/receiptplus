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
      logoUri TEXT,
      websiteUri TEXT,
      customFooter TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  // Migrate existing database: Add new columns if they don't exist
  // SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we check the schema
  try {
    // Migrate receipts table
    const receiptsSchemaCheck = await db.prepareAsync('PRAGMA table_info(receipts)');
    const receiptsSchemaResult = await receiptsSchemaCheck.executeAsync();
    const receiptsColumns = new Set<string>();
    
    for await (const row of receiptsSchemaResult) {
      receiptsColumns.add(row.name as string);
    }
    
    await receiptsSchemaCheck.finalizeAsync();
    
    // Add missing columns to receipts
    if (!receiptsColumns.has('paymentStatus')) {
      try {
        await db.execAsync('ALTER TABLE receipts ADD COLUMN paymentStatus TEXT');
      } catch (err: any) {
        // Ignore duplicate column errors
        if (!err?.message?.includes('duplicate column')) {
          console.log('Error adding paymentStatus column:', err);
        }
      }
    }
    if (!receiptsColumns.has('customerName')) {
      try {
        await db.execAsync('ALTER TABLE receipts ADD COLUMN customerName TEXT');
      } catch (err: any) {
        // Ignore duplicate column errors
        if (!err?.message?.includes('duplicate column')) {
          console.log('Error adding customerName column:', err);
        }
      }
    }
    if (!receiptsColumns.has('customerPhone')) {
      try {
        await db.execAsync('ALTER TABLE receipts ADD COLUMN customerPhone TEXT');
      } catch (err: any) {
        // Ignore duplicate column errors
        if (!err?.message?.includes('duplicate column')) {
          console.log('Error adding customerPhone column:', err);
        }
      }
    }
    if (!receiptsColumns.has('notes')) {
      try {
        await db.execAsync('ALTER TABLE receipts ADD COLUMN notes TEXT');
      } catch (err: any) {
        // Ignore duplicate column errors
        if (!err?.message?.includes('duplicate column')) {
          console.log('Error adding notes column:', err);
        }
      }
    }

    // Migrate business_profile table
    try {
      const profileSchemaCheck = await db.prepareAsync('PRAGMA table_info(business_profile)');
      const profileSchemaResult = await profileSchemaCheck.executeAsync();
      const profileColumns = new Set<string>();
      
      for await (const row of profileSchemaResult) {
        profileColumns.add(row.name as string);
      }
      
      await profileSchemaCheck.finalizeAsync();
      
      // Add missing columns to business_profile
      if (!profileColumns.has('websiteUri')) {
        try {
          await db.execAsync('ALTER TABLE business_profile ADD COLUMN websiteUri TEXT');
        } catch (err: any) {
          // Ignore duplicate column errors
          if (!err?.message?.includes('duplicate column')) {
            console.log('Error adding websiteUri column:', err);
          }
        }
      }
      if (!profileColumns.has('customFooter')) {
        try {
          await db.execAsync('ALTER TABLE business_profile ADD COLUMN customFooter TEXT');
        } catch (err: any) {
          // Ignore duplicate column errors
          if (!err?.message?.includes('duplicate column')) {
            console.log('Error adding customFooter column:', err);
          }
        }
      }
    } catch (error) {
      // If table doesn't exist yet, the CREATE TABLE above will handle it
      console.log('Profile migration check:', error);
    }
  } catch (error) {
    // If table doesn't exist yet, the CREATE TABLE above will handle it
    console.log('Migration check:', error);
  }
};

