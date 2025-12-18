import { Platform } from 'react-native';
import { getDb } from './database';
import type { Receipt, ReceiptItem, BusinessProfile } from '@/models/types';

const isWeb = Platform.OS === 'web';

// Receipt operations
export const saveReceipt = (
  receipt: Omit<Receipt, 'id'>,
  items: ReceiptItem[]
): Promise<number> => {
  if (isWeb) {
    return Promise.reject(new Error('SQLite is not supported on web. Please use Android or iOS.'));
  }
  
  return (async () => {
    const db = getDb();

    // Insert receipt
    const insertReceiptStmt = await db.prepareAsync(
      'INSERT INTO receipts (receiptNumber, total, createdAt, paymentStatus, customerName, notes) VALUES (?, ?, ?, ?, ?, ?)'
    );

    try {
      const result = await insertReceiptStmt.executeAsync<{ lastInsertRowId: number }>([
        receipt.receiptNumber,
        receipt.total,
        receipt.createdAt,
        receipt.paymentStatus || null,
        receipt.customerName || null,
        receipt.notes || null,
      ]);

      const receiptId = result.lastInsertRowId ?? 0;

      // Insert items
      if (items.length) {
        const insertItemStmt = await db.prepareAsync(
          'INSERT INTO receipt_items (receiptId, description, quantity, price) VALUES (?, ?, ?, ?)'
        );

        try {
          for (const item of items) {
            await insertItemStmt.executeAsync([
              receiptId,
              item.description,
              item.quantity,
              item.price,
            ]);
          }
        } finally {
          await insertItemStmt.finalizeAsync();
        }
      }

      return receiptId;
    } finally {
      await insertReceiptStmt.finalizeAsync();
    }
  })();
};

export const getAllReceipts = (): Promise<Receipt[]> => {
  if (isWeb) {
    return Promise.resolve([]);
  }
  
  return (async () => {
    const db = getDb();

    // Load receipts
    const receiptsStmt = await db.prepareAsync<{
      id: number;
      receiptNumber: string;
      total: number;
      createdAt: string;
      paymentStatus?: string;
      customerName?: string;
      notes?: string;
    }>('SELECT * FROM receipts ORDER BY createdAt DESC');

    const receipts: Receipt[] = [];

    try {
      const result = await receiptsStmt.executeAsync();
      for await (const row of result) {
        receipts.push({
          id: row.id,
          receiptNumber: row.receiptNumber,
          total: row.total,
          createdAt: row.createdAt,
          paymentStatus: row.paymentStatus as any,
          customerName: row.customerName,
          notes: row.notes,
          items: [], // filled below
        });
      }
    } finally {
      await receiptsStmt.finalizeAsync();
    }

    if (!receipts.length) return [];

    // Load items for all receipts
    const itemsStmt = await db.prepareAsync<{
      id: number;
      receiptId: number;
      description: string;
      quantity: number;
      price: number;
    }>('SELECT * FROM receipt_items WHERE receiptId = ?');

    try {
      for (const receipt of receipts) {
        const itemsResult = await itemsStmt.executeAsync([receipt.id]);
        const items: ReceiptItem[] = [];
        for await (const row of itemsResult) {
          items.push({
            id: row.id,
            receiptId: row.receiptId,
            description: row.description,
            quantity: row.quantity,
            price: row.price,
          });
        }
        receipt.items = items;
      }
    } finally {
      await itemsStmt.finalizeAsync();
    }

    // Newest first
    return receipts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  })();
};

export const getReceiptById = (id: number): Promise<Receipt | null> => {
  if (isWeb) {
    return Promise.resolve(null);
  }
  
  return (async () => {
    const db = getDb();

    const receiptStmt = await db.prepareAsync<{
      id: number;
      receiptNumber: string;
      total: number;
      createdAt: string;
      paymentStatus?: string;
      customerName?: string;
      notes?: string;
    }>('SELECT * FROM receipts WHERE id = ? LIMIT 1');

    try {
      const result = await receiptStmt.executeAsync([id]);
      const iterator = result[Symbol.asyncIterator]();
      const first = await iterator.next();

      if (first.done || !first.value) {
        return null;
      }

      const base = first.value;

      // Load items
      const itemsStmt = await db.prepareAsync<{
        id: number;
        receiptId: number;
        description: string;
        quantity: number;
        price: number;
      }>('SELECT * FROM receipt_items WHERE receiptId = ?');

      try {
        const itemsResult = await itemsStmt.executeAsync([base.id]);
        const items: ReceiptItem[] = [];
        for await (const row of itemsResult) {
          items.push({
            id: row.id,
            receiptId: row.receiptId,
            description: row.description,
            quantity: row.quantity,
            price: row.price,
          });
        }

        return {
          id: base.id,
          receiptNumber: base.receiptNumber,
          total: base.total,
          createdAt: base.createdAt,
          paymentStatus: base.paymentStatus as any,
          customerName: base.customerName,
          notes: base.notes,
          items,
        };
      } finally {
        await itemsStmt.finalizeAsync();
      }
    } finally {
      await receiptStmt.finalizeAsync();
    }
  })();
};

export const deleteReceipt = (id: number): Promise<void> => {
  if (isWeb) {
    return Promise.resolve();
  }
  
  return (async () => {
    const db = getDb();
    const stmt = await db.prepareAsync('DELETE FROM receipts WHERE id = ?');

    try {
      await stmt.executeAsync([id]);
    } finally {
      await stmt.finalizeAsync();
    }
  })();
};

// Business Profile operations
export const saveBusinessProfile = (profile: Omit<BusinessProfile, 'id'>): Promise<number> => {
  if (isWeb) {
    return Promise.reject(new Error('SQLite is not supported on web. Please use Android or iOS.'));
  }
  
  return (async () => {
    const db = getDb();

    // Check if a profile already exists
    const selectStmt = await db.prepareAsync<{ id: number }>(
      'SELECT id FROM business_profile LIMIT 1'
    );

    try {
      const selectResult = await selectStmt.executeAsync();
      const iterator = selectResult[Symbol.asyncIterator]();
      const first = await iterator.next();

      if (!first.done && first.value) {
        const existingId = first.value.id;

        const updateStmt = await db.prepareAsync(
          'UPDATE business_profile SET name = ?, phone = ?, address = ?, cacNumber = ?, logoUri = ? WHERE id = ?'
        );

        try {
          await updateStmt.executeAsync([
            profile.name,
            profile.phone,
            profile.address ?? null,
            profile.cacNumber ?? null,
            profile.logoUri ?? null,
            existingId,
          ]);
        } finally {
          await updateStmt.finalizeAsync();
        }

        return existingId;
      }
    } finally {
      await selectStmt.finalizeAsync();
    }

    // Insert new profile
    const insertStmt = await db.prepareAsync(
      'INSERT INTO business_profile (name, phone, address, cacNumber, logoUri) VALUES (?, ?, ?, ?, ?)'
    );

    try {
      const result = await insertStmt.executeAsync<{ lastInsertRowId: number }>([
        profile.name,
        profile.phone,
        profile.address ?? null,
        profile.cacNumber ?? null,
        profile.logoUri ?? null,
      ]);

      return result.lastInsertRowId ?? 0;
    } finally {
      await insertStmt.finalizeAsync();
    }
  })();
};

export const getBusinessProfile = (): Promise<BusinessProfile | null> => {
  if (isWeb) {
    return Promise.resolve(null);
  }
  
  return (async () => {
    const db = getDb();

    const stmt = await db.prepareAsync<{
      id: number;
      name: string;
      phone: string;
      address: string | null;
      cacNumber: string | null;
      logoUri: string | null;
    }>('SELECT * FROM business_profile LIMIT 1');

    try {
      const result = await stmt.executeAsync();
      const iterator = result[Symbol.asyncIterator]();
      const first = await iterator.next();

      if (first.done || !first.value) {
        return null;
      }

      const profile = first.value;

      return {
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        address: profile.address ?? undefined,
        cacNumber: profile.cacNumber ?? undefined,
        logoUri: profile.logoUri ?? undefined,
      };
    } finally {
      await stmt.finalizeAsync();
    }
  })();
};
