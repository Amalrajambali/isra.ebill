import { NextResponse } from 'next/server';
import { getAdminDb, isFirestoreConfigured } from '@/lib/firebase-admin';
import { INITIAL_PRODUCTS } from '@/lib/mock-data';
import type { Product } from '@/lib/types';

const COLLECTION = 'products';

async function readProducts() {
  if (!isFirestoreConfigured()) return INITIAL_PRODUCTS;

  const snapshot = await getAdminDb().collection(COLLECTION).orderBy('id').get();
  const products = snapshot.docs.map((doc) => doc.data() as Product);
  return products;
}

async function writeProducts(products: Product[]) {
  if (!isFirestoreConfigured()) return products;

  const db = getAdminDb();
  const batch = db.batch();
  const collection = db.collection(COLLECTION);

  const existing = await collection.get();
  existing.docs.forEach((doc) => batch.delete(doc.ref));
  products.forEach((product) => batch.set(collection.doc(product.id), product));
  await batch.commit();

  return products;
}

export async function GET() {
  try {
    return NextResponse.json(await readProducts());
  } catch (error) {
    console.error('Failed to load products:', error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const products = (Array.isArray(body?.products) ? body.products : body?.product ? [body.product] : []) as Product[];

    if (products.length === 0) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 });
    }

    const nextProducts = await writeProducts(products);
    return NextResponse.json(nextProducts);
  } catch (error) {
    console.error('Failed to save products:', error);
    return NextResponse.json({ error: 'Failed to save products' }, { status: 500 });
  }
}
