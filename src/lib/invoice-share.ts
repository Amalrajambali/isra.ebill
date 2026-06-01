import type { Invoice } from '@/lib/types';
import { buildPublicInvoiceUrl } from '@/lib/invoice-api';

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

export const buildShareMessage = (invoice: Invoice, origin: string) => {
  const invoiceUrl = buildPublicInvoiceUrl(origin, invoice.invoiceNumber);

  return [
    'Thank you for shopping with ISRA Ethnics!',
    '',
    `Invoice: ${invoice.invoiceNumber}`,
    `Amount: ${formatWhatsAppAmount(invoice.grandTotal)}`,
    '',
    'Download Invoice:',
    invoiceUrl,
    '',
    'Happy Shopping!',
    '',
    'Instagram: @isra.ethnic',
  ].join('\n');
};

export const buildWhatsAppUrl = (customerMobile: string, message: string) => {
  const mobile = normalizeWhatsAppNumber(customerMobile);
  return `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
};
