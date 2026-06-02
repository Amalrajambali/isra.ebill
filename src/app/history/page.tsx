import React, { Suspense } from 'react';
import HistoryClient from './HistoryClient';

export const dynamic = 'force-dynamic';

export default function InvoiceHistory() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading history...</div>}>
      <HistoryClient />
    </Suspense>
  );
}
