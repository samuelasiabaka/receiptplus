export interface ReceiptItem {
  id?: number;
  receiptId?: number;
  description: string;
  quantity: number;
  price: number;
}

export interface Receipt {
  id?: number;
  receiptNumber: string;
  total: number;
  createdAt: string;
  items: ReceiptItem[];
}

export interface BusinessProfile {
  id?: number;
  name: string;
  phone: string;
  address?: string;
  cacNumber?: string;
  logoUri?: string;
}

