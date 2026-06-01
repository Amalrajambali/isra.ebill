import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_INVOICES } from '@/lib/mock-data';
import { getAdminDb, isFirestoreConfigured } from '@/lib/firebase-admin';
import type { Invoice } from '@/lib/types';

export const dynamic = 'force-dynamic';

function normalizeInvoice(payload: unknown): Invoice | null {
  if (!payload || typeof payload !== 'object') return null;
  const invoice = payload as Invoice;
  if (!invoice.invoiceNumber || !invoice.customerName || !invoice.customerMobile) return null;
  return invoice;
}

async function readInvoicesFromFirestore() {
  const snapshot = await getAdminDb().collection('invoices').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => doc.data() as Invoice);
}

export async function GET() {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(INITIAL_INVOICES);
  }

  try {
    const invoices = await readInvoicesFromFirestore();
    return NextResponse.json(invoices.length ? invoices : INITIAL_INVOICES);
  } catch (error) {
    console.error('Failed to read invoices:', error);
    return NextResponse.json(INITIAL_INVOICES, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      {
        error: 'Firestore is not configured.',
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { invoice?: unknown };
    const invoice = normalizeInvoice(body.invoice);

    if (!invoice) {
      return NextResponse.json({ error: 'Invalid invoice payload' }, { status: 400 });
    }

    const doc = {
      ...invoice,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await getAdminDb().collection('invoices').doc(invoice.invoiceNumber).set(doc, { merge: true });
    return NextResponse.json({ invoice: doc });
  } catch (error) {
    console.error('Failed to store invoice:', error);
    return NextResponse.json({ error: 'Failed to store invoice' }, { status: 500 });
  }
}
