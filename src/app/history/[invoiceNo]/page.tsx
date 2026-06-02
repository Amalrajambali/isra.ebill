"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Download, MessageSquare, Phone, User, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { buildShareMessage, buildWhatsAppUrl, downloadInvoicePdf } from '@/lib/invoice-share';
import { getInvoice } from '@/lib/invoice-api';
import type { Invoice } from '@/lib/types';

export default function InvoiceDetailsPage() {
  const params = useParams<{ invoiceNo: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const invoiceNo = decodeURIComponent(params.invoiceNo);
      setInvoice(await getInvoice(invoiceNo));
      setLoading(false);
    };

    load();
  }, [params.invoiceNo]);

  const handleShare = () => {
    if (!invoice) return;
    const pdfUrl = invoice.pdfUrl || '';

    if (!pdfUrl) {
      toast({
        variant: 'destructive',
        title: 'PDF not ready',
        description: 'This invoice does not have a public PDF link yet.',
      });
      return;
    }

    window.open(buildWhatsAppUrl(invoice.customerMobile, buildShareMessage(invoice)), '_blank', 'noreferrer');
  };

  const handleDownload = () => {
    if (!invoice) return;
    if (!invoice.pdfUrl) {
      toast({
        variant: 'destructive',
        title: 'PDF not ready',
        description: 'This invoice does not have a public PDF link yet.',
      });
      return;
    }

    downloadInvoicePdf(invoice);
  };

  return (
    <Shell>
      <div className="max-w-5xl mx-auto space-y-6 pb-10">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-bold">Invoice Details</h1>
            <p className="text-muted-foreground">View the invoice summary without opening the PDF.</p>
          </div>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline">{loading ? 'Loading...' : invoice?.invoiceNumber || 'Invoice not found'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {invoice ? `Created on ${formatDate(invoice.date)}` : 'The invoice could not be loaded.'}
              </p>
            </div>
            {invoice ? <Badge className="bg-green-100 text-green-700 border-none">PAID</Badge> : null}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-16 text-center text-muted-foreground">Loading invoice details...</div>
            ) : !invoice ? (
              <div className="py-16 text-center text-muted-foreground">Invoice not found.</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Customer</p>
                    <p className="font-semibold text-lg flex items-center gap-2 mt-1"><User className="h-4 w-4" />{invoice.customerName}</p>
                  </div>
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Mobile</p>
                    <p className="font-semibold text-lg flex items-center gap-2 mt-1"><Phone className="h-4 w-4" />{invoice.customerMobile}</p>
                  </div>
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total</p>
                    <p className="font-semibold text-lg text-secondary mt-1">{formatCurrency(invoice.grandTotal)}</p>
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground">
                    <Package className="h-4 w-4" /> Items
                  </div>
                  <div className="space-y-3">
                    {invoice.items.map((item) => (
                      <div key={`${item.productId}-${item.productName}`} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-3">
                        <div>
                          <p className="font-semibold">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty {item.quantity} • {formatCurrency(item.price)}</p>
                        </div>
                        <p className="font-bold">{formatCurrency(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Subtotal</p>
                    <p className="font-semibold mt-1">{formatCurrency(invoice.subtotal)}</p>
                  </div>
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Discount</p>
                    <p className="font-semibold mt-1 text-green-700">-{formatCurrency(invoice.totalDiscount)}</p>
                  </div>
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Date</p>
                    <p className="font-semibold mt-1 flex items-center gap-2"><Calendar className="h-4 w-4" />{formatDate(invoice.date)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleDownload} className="bg-primary">
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </Button>
                  <Button onClick={handleShare} className="bg-[#25D366] hover:bg-[#25D366]/90 text-white">
                    <MessageSquare className="mr-2 h-4 w-4" /> Share to WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
