import { jsPDF } from 'jspdf';
import type { Invoice } from '@/lib/types';

const COLORS = {
  ink: [28, 34, 48] as const,
  muted: [99, 115, 129] as const,
  line: [226, 232, 240] as const,
  accent: [24, 33, 63] as const,
  soft: [247, 250, 252] as const,
  green: [22, 163, 74] as const,
};

function currency(value: number) {
  return `Rs ${value.toLocaleString('en-IN')}`;
}

function drawHeader(pdf: jsPDF, invoice: Invoice) {
  const width = pdf.internal.pageSize.getWidth();
  const left = 18;
  const top = 18;

  pdf.setTextColor(...COLORS.ink);

  pdf.setFont('times', 'bold');
  pdf.setFontSize(20);
  pdf.text('ISRA ETHNICS', left, top);

  pdf.setFont('times', 'normal');
  pdf.setFontSize(8.5);
  pdf.setCharSpace(0.8);
  pdf.text('BOUTIQUE & FASHION STUDIO', left, top + 5.5);
  pdf.setCharSpace(0);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(...COLORS.muted);
  pdf.text('Thekkummuri, Tirur', left, top + 12);
  pdf.text('Ph: 8113081120, 9961264495', left, top + 17);
  pdf.text('Instagram: @isra.ethnic', left, top + 22);

  pdf.setFillColor(...COLORS.accent);
  pdf.roundedRect(width - 44, top - 1, 26, 10, 1.8, 1.8, 'F');

  pdf.setFontSize(9.5);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(`Invoice No: `, width - 46, top + 18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.ink);
  pdf.text(invoice.invoiceNumber, width - 25, top + 18);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.muted);
  pdf.text(`Date: ${new Date(invoice.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`, width - 46, top + 24);

  pdf.setDrawColor(...COLORS.line);
  pdf.setLineWidth(0.6);
  pdf.line(left, top + 29, width - left, top + 29);
}

function drawBilledTo(pdf: jsPDF, invoice: Invoice) {
  const left = 18;
  let y = 50;

  pdf.setTextColor(...COLORS.ink);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  pdf.setCharSpace(1.2);
  pdf.text('BILLED TO', left, y);
  pdf.setCharSpace(0);

  pdf.setDrawColor(...COLORS.line);
  pdf.line(left, y + 1.8, left + 45, y + 1.8);

  y += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(invoice.customerName, left, y);

  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(invoice.customerMobile, left, y);

  if (invoice.customerAddress) {
    y += 5;
    const wrapped = pdf.splitTextToSize(invoice.customerAddress, 80);
    pdf.text(wrapped, left, y);
    y += wrapped.length * 4.5;
  }
}

function drawItemsTable(pdf: jsPDF, invoice: Invoice) {
  const left = 18;
  const width = pdf.internal.pageSize.getWidth();
  const right = width - 18;
  let y = 92;
  const rowTop = y;

  const columns = [
    { label: 'DESCRIPTION', x: left + 3, width: 72 },
    { label: 'PRICE', x: left + 84, width: 24, align: 'right' as const },
    { label: 'QTY', x: left + 110, width: 14, align: 'center' as const },
    { label: 'DISCOUNT', x: left + 128, width: 22, align: 'center' as const },
    { label: 'AMOUNT', x: right - 18, width: 22, align: 'right' as const },
  ];

  pdf.setFillColor(...COLORS.soft);
  pdf.setDrawColor(...COLORS.line);
  pdf.rect(left, y, right - left, 11, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.muted);
  columns.forEach((col) => {
    pdf.text(col.label, col.x, y + 7, { align: col.align ?? 'left' });
  });

  y += 11;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(...COLORS.ink);

  invoice.items.forEach((item) => {
    const rowHeight = Math.max(16, item.productName.length > 34 ? 20 : 16);
    pdf.setDrawColor(...COLORS.line);
    pdf.rect(left, y, right - left, rowHeight);

    const name = pdf.splitTextToSize(item.productName, 70);
    pdf.setFont('helvetica', 'bold');
    pdf.text(name, left + 3, y + 8);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...COLORS.muted);
    pdf.text('Premium Collection', left + 3, y + 12.5);

    pdf.setFontSize(9.5);
    pdf.setTextColor(...COLORS.ink);
    pdf.text(currency(item.price), left + 98, y + 10, { align: 'right' });
    pdf.text(String(item.quantity), left + 117, y + 10, { align: 'center' });
    pdf.text(item.discount > 0 ? `-${currency(item.discount)}` : '-', left + 139, y + 10, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.text(currency(item.total), right - 4, y + 10, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.ink);

    y += rowHeight;
  });

  return y;
}

function drawSummary(pdf: jsPDF, invoice: Invoice, y: number) {
  const width = pdf.internal.pageSize.getWidth();
  const left = 18;
  const right = width - 18;

  const summaryX = right - 63;
  const labelX = summaryX;
  const valueX = right;

  pdf.setTextColor(...COLORS.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text('Subtotal', labelX, y + 10);
  pdf.text(currency(invoice.subtotal), valueX, y + 10, { align: 'right' });

  pdf.text('Total Discount', labelX, y + 17);
  pdf.setTextColor(...COLORS.green);
  pdf.text(`-Rs ${invoice.totalDiscount.toLocaleString('en-IN')}`, valueX, y + 17, { align: 'right' });

  pdf.setDrawColor(...COLORS.ink);
  pdf.setLineWidth(0.5);
  pdf.line(summaryX, y + 20, right, y + 20);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.ink);
  pdf.setFontSize(13);
  pdf.text('Grand Total', labelX, y + 31);
  pdf.text(currency(invoice.grandTotal), valueX, y + 31, { align: 'right' });

  pdf.setDrawColor(...COLORS.line);
  pdf.line(left, y + 42, right, y + 42);
}

function drawFooter(pdf: jsPDF) {
  const width = pdf.internal.pageSize.getWidth();
  const left = 18;
  const y = 187;

  pdf.setTextColor(...COLORS.ink);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(11);
  pdf.text('"Thank you for shopping with ISRA Ethnics. Happy Shopping!"', width / 2, y, {
    align: 'center',
  });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setCharSpace(0.8);
  pdf.setTextColor(...COLORS.line);
  pdf.text('VISIT US AGAIN FOR THE LATEST SAREE & CHURIDAR COLLECTIONS', width / 2, y + 6, {
    align: 'center',
  });
  pdf.setCharSpace(0);
}

export function createInvoicePdfBuffer(invoice: Invoice) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  pdf.setProperties({ title: invoice.invoiceNumber, subject: 'Invoice', creator: 'ISRA Ethnics' });

  drawHeader(pdf, invoice);
  drawBilledTo(pdf, invoice);
  const yAfterTable = drawItemsTable(pdf, invoice);
  drawSummary(pdf, invoice, yAfterTable + 8);
  drawFooter(pdf);

  return Buffer.from(pdf.output('arraybuffer'));
}
