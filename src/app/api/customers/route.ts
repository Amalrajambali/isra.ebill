import { NextResponse } from 'next/server';
import { getAdminDb, isFirestoreConfigured } from '@/lib/firebase-admin';
import type { Customer } from '@/lib/types';

const COLLECTION = 'customers';

async function readCustomers() {
  if (!isFirestoreConfigured()) return [];

  const snapshot = await getAdminDb().collection(COLLECTION).orderBy('name').get();
  const customers = snapshot.docs.map((doc) => doc.data() as Customer);
  return customers;
}

async function writeCustomers(customers: Customer[]) {
  if (!isFirestoreConfigured()) return customers;

  const db = getAdminDb();
  const batch = db.batch();
  const collection = db.collection(COLLECTION);

  const existing = await collection.get();
  existing.docs.forEach((doc) => batch.delete(doc.ref));
  customers.forEach((customer) => batch.set(collection.doc(customer.id), customer));
  await batch.commit();

  return customers;
}

export async function GET() {
  try {
    return NextResponse.json(await readCustomers());
  } catch (error) {
    console.error('Failed to load customers:', error);
    return NextResponse.json({ error: 'Failed to load customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customers = (Array.isArray(body?.customers) ? body.customers : body?.customer ? [body.customer] : []) as Customer[];

    if (customers.length === 0) {
      return NextResponse.json({ error: 'No customers provided' }, { status: 400 });
    }

    const nextCustomers = await writeCustomers(customers);
    return NextResponse.json(nextCustomers);
  } catch (error) {
    console.error('Failed to save customers:', error);
    return NextResponse.json({ error: 'Failed to save customers' }, { status: 500 });
  }
}
