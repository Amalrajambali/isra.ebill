import type { Invoice } from '@/lib/types';

export const normalizeWhatsAppNumber = (customerMobile: string) => {
  const digits = customerMobile.replace(/\D/g, '');

  if (digits.startsWith('91') && digits.length > 10) {
    return digits;
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
};

export const formatWhatsAppAmount = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export const buildShareMessage = (invoice: Invoice) => {
  const invoiceUrl = invoice.pdfUrl || '';

  return [
    'Dear Customer,',
    '',
    'Thank you for shopping with ISRA Ethnics.',
    '',
    `Invoice No: ${invoice.invoiceNumber}`,
    `Amount: ${formatWhatsAppAmount(invoice.grandTotal)}`,
    '',
    '📄 View / Download Invoice:',
    invoiceUrl,
  ].join('\n');
};

export const buildWhatsAppUrl = (customerMobile: string, message: string) => {
  const mobile = normalizeWhatsAppNumber(customerMobile);
  return `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
};
