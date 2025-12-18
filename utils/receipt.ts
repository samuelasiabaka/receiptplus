import type { Receipt } from '@/models/types';

export const generateReceiptNumber = (businessName: string): string => {
  // Get first 3 letters of business name, uppercase, remove spaces and special chars
  const prefix = businessName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, 'X'); // Pad with X if less than 3 characters
  
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

export const formatCurrency = (amount: number): string => {
  return `₦${amount.toFixed(2)}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
  
  return `${day}/${month}/${year}   ${displayHours}:${minutes} ${ampm}`;
};

export const formatReceiptText = (receipt: Receipt, businessProfile: { name: string; phone: string; address?: string; cacNumber?: string }): string => {
  const divider = '═'.repeat(40);
  const items = receipt.items
    .map(
      (item) =>
        `${item.description}\n${item.quantity} × ₦${item.price.toFixed(2)} = ₦${(item.quantity * item.price).toFixed(2)}`
    )
    .join('\n\n');

  return `
${divider}
${businessProfile.name}
${businessProfile.address || ''}
${businessProfile.phone}
${businessProfile.cacNumber ? `CAC: ${businessProfile.cacNumber}` : ''}
${divider}

Receipt #: ${receipt.receiptNumber}
Date: ${formatDate(receipt.createdAt)}

${items}

${divider}
TOTAL: ₦${receipt.total.toFixed(2)}
${divider}

Thank you for your patronage!
  `.trim();
};

