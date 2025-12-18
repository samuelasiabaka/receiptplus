export interface ReceiptItem {
  id?: number;
  receiptId?: number;
  description: string;
  quantity: number;
  price: number;
}

export type PaymentStatus = 'paid' | 'part_paid' | 'not_paid';

export interface Receipt {
  id?: number;
  receiptNumber: string;
  total: number;
  createdAt: string;
  items: ReceiptItem[];
  paymentStatus?: PaymentStatus;
  customerName?: string;
  notes?: string;
}

export interface BusinessProfile {
  id?: number;
  name: string;
  phone: string;
  address?: string;
  cacNumber?: string;
  logoUri?: string;
}

