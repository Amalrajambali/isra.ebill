import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_INVOICES } from '@/lib/mock-data';
import { getAdminDb, isFirestoreConfigured } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ invoiceNo: string }> }) {
  const { invoiceNo } = await params;
  const invoiceNumber = decodeURIComponent(invoiceNo);

  if (!isFirestoreConfigured()) {
    const fallback = INITIAL_INVOICES.find((invoice) => invoice.invoiceNumber === invoiceNumber);
    if (fallback) {
      return NextResponse.json({ invoice: fallback });
    }
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  try {
    const doc = await getAdminDb().collection('invoices').doc(invoiceNumber).get();
    if (!doc.exists) {
      const fallback = INITIAL_INVOICES.find((invoice) => invoice.invoiceNumber === invoiceNumber);
      if (fallback) {
        return NextResponse.json({ invoice: fallback });
      }
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice: doc.data() });
  } catch (error) {
    console.error('Failed to read invoice:', error);
    return NextResponse.json({ error: 'Failed to read invoice' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ invoiceNo: string }> }) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json({ error: 'Firestore is not configured.' }, { status: 503 });
  }

  const { invoiceNo } = await params;
  const invoiceNumber = decodeURIComponent(invoiceNo);

  try {
    await getAdminDb().collection('invoices').doc(invoiceNumber).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
