import type { Receipt } from '@/models/types';

export const generateReceiptNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `RCP-${timestamp}-${random}`;
};

export const formatCurrency = (amount: number): string => {
  return `₦${amount.toFixed(2)}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

