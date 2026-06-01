"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Button } from '@/components/ui/button';
import { Download, MessageSquare, ArrowLeft, FileText } from 'lucide-react';
import { InvoicePDF } from '@/components/invoice/InvoicePDF';
import type { Invoice } from '@/lib/types';
import { buildShareMessage, buildWhatsAppUrl } from '@/lib/invoice-share';
import { getInvoiceByNumber } from '@/lib/invoice-store';
import { useToast } from '@/hooks/use-toast';

export default function InvoicePage() {
  const params = useParams<{ invoiceNo: string }>();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const downloadTriggeredRef = useRef(false);

  useEffect(() => {
    const invoiceNumber = decodeURIComponent(params.invoiceNo);
    const stored = getInvoiceByNumber(invoiceNumber);
    setInvoice(stored ?? null);
    setIsLoaded(true);
  }, [params.invoiceNo]);

  const generatePDFFile = async (): Promise<File | null> => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const docElement = document.getElementById('invoice-document');
      if (!docElement || !invoice) return null;

      const canvas = await html2canvas(docElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const pdfBlob = pdf.output('blob');
      return new File([pdfBlob], `${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleDownload = async () => {
    if (!invoice) return;

    setIsGenerating(true);
    const file = await generatePDFFile();

    if (!file) {
      setIsGenerating(false);
      toast({
        variant: 'destructive',
        title: 'PDF Not Ready',
        description: 'The invoice PDF could not be generated.',
      });
      return;
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
    setIsGenerating(false);
  };

  useEffect(() => {
    if (!invoice || downloadTriggeredRef.current) return;
    if (searchParams.get('download') !== '1') return;

    downloadTriggeredRef.current = true;
    handleDownload();
  }, [invoice, searchParams]);

  const handleShare = () => {
    if (!invoice) return;

    const message = buildShareMessage(invoice, window.location.origin);
    window.open(buildWhatsAppUrl(invoice.customerMobile, message), '_blank', 'noreferrer');
  };

  if (isLoaded && !invoice) {
    return (
      <Shell>
        <div className="max-w-3xl mx-auto py-10 space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <a href="/billing"><ArrowLeft className="h-4 w-4" /></a>
            </Button>
            <div>
              <h1 className="text-3xl font-headline font-bold">Invoice not found</h1>
              <p className="text-muted-foreground">This invoice is not available in the current browser storage.</p>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!invoice) {
    return (
      <Shell>
        <div className="max-w-3xl mx-auto py-10">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <a href="/billing"><ArrowLeft className="h-4 w-4" /></a>
            </Button>
            <div>
              <div className="flex items-center gap-2 text-secondary">
                <FileText className="h-4 w-4" />
                <p className="text-sm font-semibold uppercase tracking-[0.2em]">Invoice Link</p>
              </div>
              <h1 className="text-3xl font-headline font-bold">{invoice.invoiceNumber}</h1>
              <p className="text-muted-foreground">Short invoice URL for mobile sharing and download.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleDownload} disabled={isGenerating}>
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? 'Preparing...' : 'Download PDF'}
            </Button>
            <Button className="bg-[#25D366] hover:bg-[#25D366]/90 text-white" onClick={handleShare}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Share to WhatsApp
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-slate-100 p-3 shadow-2xl md:p-6">
          <div className="w-fit min-w-full">
            <InvoicePDF
              invoice={invoice}
              settings={{
                name: 'ISRA Ethnics',
                address: 'Thekkummuri, Tirur',
                phone1: '8113081120',
                phone2: '9961264495',
                instagram: '@isra.ethnic',
                thankYouMessage: 'Happy Shopping!',
              }}
            />
          </div>
        </div>
      </div>
    </Shell>
  );
}
