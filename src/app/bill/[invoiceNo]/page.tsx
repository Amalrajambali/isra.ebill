import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Download, FileText } from 'lucide-react';
import { getAdminDb, isFirestoreConfigured } from '@/lib/firebase-admin';
import type { Invoice } from '@/lib/types';
import styles from './bill.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your Bill | ISRA Churidars & Sarees',
  robots: { index: false, follow: false },
};

type StoredInvoice = Invoice & { createdAt?: number };

async function getInvoice(invoiceNumber: string): Promise<StoredInvoice | null> {
  if (!isFirestoreConfigured()) return null;

  try {
    const doc = await getAdminDb().collection('invoices').doc(invoiceNumber).get();
    return doc.exists ? (doc.data() as StoredInvoice) : null;
  } catch (error) {
    console.error('Failed to read invoice for bill page:', error);
    return null;
  }
}

const rupees = (value: number, decimals = 2) =>
  `₹ ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

function formatBillDate(invoice: StoredInvoice) {
  // Prefer the server timestamp: it carries the time and is shown in Indian time.
  if (invoice.createdAt) {
    return new Date(invoice.createdAt)
      .toLocaleString('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .replace(',', '')
      .replace(/am|pm/i, (period) => period.toUpperCase());
  }

  return new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function MetaRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <p>
      <span className={bold ? styles.metaLabelBold : styles.metaLabel}>{label}</span>
      <span className={styles.metaValue}>{value}</span>
    </p>
  );
}

export default async function BillPage({ params }: { params: Promise<{ invoiceNo: string }> }) {
  const { invoiceNo } = await params;
  const invoiceNumber = decodeURIComponent(invoiceNo);
  const invoice = await getInvoice(invoiceNumber);

  if (!invoice) notFound();

  const pdfUrl = `/api/invoices/pdf/${encodeURIComponent(invoice.invoiceNumber)}`;
  const customerName = invoice.customerName?.trim() || 'Walk-in Customer';
  const mobile = invoice.customerMobile?.trim();
  const address = invoice.customerAddress?.trim();

  return (
    <div className={styles.page}>
      <main className={styles.wrap}>
        {/* Shop + bill on one receipt */}
        <section className={`${styles.card} ${styles.receipt}`}>
          <div className={styles.shop}>
            <img src="/isra-logo-mono.png" alt="ISRA Churidars & Sarees" className={styles.logo} />
            <div className={styles.shopInfo}>
              <p>Thekkummuri, Tirur</p>
              <p>Ph: 8113081120, 9961264495</p>
              <p>Instagram: @isra.ethnic</p>
            </div>
          </div>

          <div className={styles.dash} />

          <div className={styles.meta}>
            <MetaRow label="Invoice No" value={invoice.invoiceNumber} />
            <MetaRow label="Date" value={formatBillDate(invoice)} bold />
            <MetaRow label="Customer" value={customerName} />
            {mobile && <MetaRow label="Mobile" value={mobile} />}
            {address && <MetaRow label="Address" value={address} />}
          </div>

          <ol className={styles.items}>
            {invoice.items.map((item, index) => (
              <li key={`${item.productId}-${index}`} className={styles.item}>
                <div className={styles.itemTop}>
                  <span className={styles.itemName}>
                    <span className={styles.itemIndex}>{index + 1}.</span>
                    <span>
                      {item.productName} X {item.quantity}
                    </span>
                  </span>
                  <span className={styles.itemAmount}>{rupees(item.total, 0)}</span>
                </div>
                <p className={styles.itemSub}>
                  {rupees(item.price, 0)} × {item.quantity}
                  {item.discount > 0 && <span className={styles.discount}> · Discount -{rupees(item.discount, 0)}</span>}
                </p>
              </li>
            ))}
          </ol>

          <p className={styles.summaryTitle}>Summary</p>
          <div className={styles.sumRow}>
            <span>Sub Total</span>
            <span>{rupees(invoice.subtotal)}</span>
          </div>
          <div className={styles.sumRow}>
            <span>Total Discount</span>
            <span>{rupees(invoice.totalDiscount)}</span>
          </div>

          <div className={styles.dash} />

          <p className={styles.totalLabel}>Total Amount</p>
          <div className={styles.totalRow}>
            <span className={styles.totalItems}>{invoice.items.length} item(s)</span>
            <span className={styles.totalAmount}>{rupees(invoice.grandTotal)}</span>
          </div>
        </section>

        {/* Thank you */}
        <section className={`${styles.card} ${styles.thanks}`}>
          <p className={styles.thanksTitle}>Thank you for shopping with ISRA Churidars &amp; Sarees</p>
          <p className={styles.happy}>Happy Shopping!</p>
          <p className={styles.visit}>Visit us again for the latest saree &amp; churidar collections</p>
        </section>

        {/* Actions */}
        <section className={styles.card}>
          <a href={pdfUrl} download={`${invoice.invoiceNumber}.pdf`} className={styles.primaryBtn}>
            <Download size={20} /> Download Invoice
          </a>
          <a href={pdfUrl} target="_blank" rel="noreferrer" className={styles.secondaryLink}>
            <FileText size={16} /> View A4 / Desktop Bill
          </a>
        </section>
      </main>
    </div>
  );
}
