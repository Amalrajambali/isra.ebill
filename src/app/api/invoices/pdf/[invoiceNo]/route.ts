import { NextRequest, NextResponse } from 'next/server';
import { createInvoicePdfBuffer } from '@/lib/invoice-pdf';
import { getAdminDb, isFirestoreConfigured } from '@/lib/firebase-admin';
import type { Invoice } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getInvoiceByNumber(invoiceNumber: string) {
  if (!isFirestoreConfigured()) return null;

  try {
    const doc = await getAdminDb().collection('invoices').doc(invoiceNumber).get();
    if (doc.exists) {
      return doc.data() as Invoice;
    }
  } catch (error) {
    console.error('Failed to read invoice for PDF:', error);
  }

  return null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ invoiceNo: string }> }) {
  const { invoiceNo } = await params;
  const invoiceNumber = decodeURIComponent(invoiceNo);
  const invoice = await getInvoiceByNumber(invoiceNumber);

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const pdfBytes = createInvoicePdfBuffer(invoice);

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
