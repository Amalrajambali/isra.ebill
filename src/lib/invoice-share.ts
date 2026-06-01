import type { Invoice } from '@/lib/types';

export const formatWhatsAppAmount = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

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

export const buildInvoicePdfPayload = (invoice: Invoice) => encodeURIComponent(JSON.stringify(invoice));

export const buildInvoicePdfUrl = (origin: string, invoice: Invoice) =>
  `${origin}/api/invoices/pdf?payload=${buildInvoicePdfPayload(invoice)}`;

export const buildWhatsAppMessage = (invoice: Invoice, pdfDownloadUrl: string) =>
  `Dear Customer, Thank you for shopping with ISRA Ethnics.\n\nInvoice No: ${invoice.invoiceNumber}\n\nAmount: ${formatWhatsAppAmount(invoice.grandTotal)}\n\nDownload Invoice:\n${pdfDownloadUrl}`;

export const buildWhatsAppUrl = (customerMobile: string, message: string) => {
  const mobile = normalizeWhatsAppNumber(customerMobile);
  return `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
};
