import { NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';
import { getAdminApp } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

function getBucketName() {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    (process.env.FIREBASE_PROJECT_ID ? `${process.env.FIREBASE_PROJECT_ID}.appspot.com` : '')
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const invoiceNumber = String(formData.get('invoiceNumber') || '').trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: { message: 'A PDF file is required.' } }, { status: 400 });
    }

    if (!invoiceNumber) {
      return NextResponse.json({ error: { message: 'Invoice number is required.' } }, { status: 400 });
    }

    const bucketName = getBucketName();
    if (!bucketName) {
      return NextResponse.json(
        { error: { message: 'Firebase Storage bucket is not configured.' } },
        { status: 500 },
      );
    }

    const storage = getStorage(getAdminApp());
    const bucket = storage.bucket(bucketName);
    const path = `invoices/${invoiceNumber}.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfFile = bucket.file(path);

    await pdfFile.save(buffer, {
      contentType: file.type || 'application/pdf',
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        metadata: {
          invoiceNumber,
          downloadToken: randomUUID(),
        },
      },
    });

    const [pdfUrl] = await pdfFile.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    return NextResponse.json({
      pdfUrl,
      pdfPublicId: path,
    });
  } catch (error) {
    console.error('Firebase Storage upload failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload PDF to Firebase Storage.';
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
