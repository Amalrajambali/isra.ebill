import { NextRequest, NextResponse } from 'next/server';
import { createInvoicePdfBuffer } from '@/lib/invoice-pdf';
import { getAdminDb, isFirestoreConfigured } from '@/lib/firebase-admin';
import type { Invoice } from '@/lib/types';

export const dynamic = 'force-dynamic';

function parseInvoice(payload: string | null): Invoice | null {
  if (!payload) return null;

  try {
    return JSON.parse(decodeURIComponent(payload)) as Invoice;
  } catch {
    return null;
  }
}

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

export async function GET(request: NextRequest) {
  const invoiceNumber = request.nextUrl.searchParams.get('invoiceNumber');
  const pathInvoiceNumber = request.nextUrl.pathname.split('/').pop();

  const resolvedInvoice =
    (invoiceNumber ? await getInvoiceByNumber(invoiceNumber) : null) ||
    (pathInvoiceNumber && pathInvoiceNumber !== 'pdf' ? await getInvoiceByNumber(decodeURIComponent(pathInvoiceNumber)) : null);

  if (!resolvedInvoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const pdfBytes = createInvoicePdfBuffer(resolvedInvoice);

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${resolvedInvoice.invoiceNumber}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
