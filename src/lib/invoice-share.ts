import type { Invoice } from '@/lib/types';

export const formatWhatsAppAmount = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export const buildInvoicePdfPayload = (invoice: Invoice) => encodeURIComponent(JSON.stringify(invoice));

export const buildInvoicePdfUrl = (origin: string, invoice: Invoice) =>
  `${origin}/api/invoices/pdf?payload=${buildInvoicePdfPayload(invoice)}`;

export const buildWhatsAppMessage = (invoice: Invoice, pdfDownloadUrl: string) =>
  `Dear Customer, Thank you for shopping with ISRA Ethnics.\n\nInvoice No: ${invoice.invoiceNumber}\n\nAmount: ${formatWhatsAppAmount(invoice.grandTotal)}\n\nDownload Invoice:\n${pdfDownloadUrl}`;

export const buildWhatsAppUrl = (customerMobile: string, message: string) => {
  const mobile = customerMobile.replace(/\D/g, '');
  return `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`;
};
