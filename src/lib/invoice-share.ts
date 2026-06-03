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

export const buildInvoicePdfUrl = (invoiceNumber: string, origin?: string) => {
  const path = `/api/invoices/pdf/${encodeURIComponent(invoiceNumber)}`;
  return origin ? new URL(path, origin).toString() : path;
};

export const buildShareMessage = (invoice: Invoice) => {
  const invoiceUrl =
    invoice.pdfUrl ||
    (typeof window !== 'undefined' ? buildInvoicePdfUrl(invoice.invoiceNumber, window.location.origin) : '');

  return [
    'Dear Customer,',
    '',
    'Thank you for shopping with ISRA Churidars & Sarees.',
    '',
    `Invoice No: ${invoice.invoiceNumber}`,
    `Amount: ${formatWhatsAppAmount(invoice.grandTotal)}`,
    '',
    'Invoice:',
    invoiceUrl,
    '',
    'Happy Shopping!'
  ].join('\n');
}

export const buildWhatsAppUrl = (customerMobile: string, message: string) => {
  const mobile = normalizeWhatsAppNumber(customerMobile);
  return `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
};

export const downloadInvoicePdf = (invoice: Invoice) => {
  const pdfUrl =
    invoice.pdfUrl ||
    (typeof window !== 'undefined' ? buildInvoicePdfUrl(invoice.invoiceNumber, window.location.origin) : '');

  if (!pdfUrl || typeof window === 'undefined') return;

  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = `${invoice.invoiceNumber}.pdf`;
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
};
