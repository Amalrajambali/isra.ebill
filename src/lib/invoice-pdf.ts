import { jsPDF } from 'jspdf';
import type { Invoice } from '@/lib/types';

export function createInvoicePdfBuffer(invoice: Invoice) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const left = 16;
  let y = 18;

  pdf.setTextColor(17, 24, 39);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('ISRA ETHNICS', left, y);

  y += 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Dear Customer, Thank you for shopping with ISRA Ethnics.', left, y);

  y += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Invoice No: ${invoice.invoiceNumber}`, left, y);
  y += 6;
  pdf.text(`Date: ${invoice.date}`, left, y);
  y += 6;
  pdf.text(`Customer: ${invoice.customerName}`, left, y);
  y += 6;
  pdf.text(`Mobile: ${invoice.customerMobile}`, left, y);

  y += 10;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(left, y, pageWidth - left, y);
  y += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Items', left, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');

  invoice.items.forEach((item) => {
    const line = `${item.productName} x${item.quantity} - ${item.total.toLocaleString('en-IN')}`;
    const wrapped = pdf.splitTextToSize(line, pageWidth - left * 2);
    pdf.text(wrapped, left, y);
    y += wrapped.length * 6;
  });

  y += 4;
  pdf.line(left, y, pageWidth - left, y);
  y += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Grand Total: ₹${invoice.grandTotal.toLocaleString('en-IN')}`, left, y);
  y += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.text('Happy Shopping!', left, y);

  return Buffer.from(pdf.output('arraybuffer'));
}
