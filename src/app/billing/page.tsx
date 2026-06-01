"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Trash2, Save, Sparkles, User, Search, Phone, UserCheck, UserPlus, Share2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { InvoiceItem, Customer, Product, Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { customerPurchaseSuggestions } from '@/ai/flows/customer-purchase-suggestions';
import { InvoicePDF } from '@/components/invoice/InvoicePDF';
import { buildShareMessage, buildWhatsAppUrl } from '@/lib/invoice-share';
import { listInvoices, upsertInvoice } from '@/lib/invoice-api';
import { loadProducts } from '@/lib/product-store';
import { addCustomer, findCustomerByMobile, loadCustomers, upsertCustomer } from '@/lib/customer-store';
import { uploadInvoicePdf } from '@/lib/cloudinary';

export default function NewInvoice() {
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Partial<Customer>>({ name: '', mobile: '', address: '' });
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [successInvoice, setSuccessInvoice] = useState<Invoice | null>(null);
  const [pdfUploadStatus, setPdfUploadStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'failed'>('idle');
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredCustomerName = useDeferredValue(customer.name ?? '');
  const deferredCustomerMobile = useDeferredValue(customer.mobile ?? '');

  const normalizedCustomerMobile = deferredCustomerMobile.replace(/\D/g, '');
  const customerMatches = useMemo(() => {
    const nameQuery = deferredCustomerName.trim().toLowerCase();

    if (!nameQuery && !normalizedCustomerMobile) return [];

    return customers.filter((item) => {
      const nameMatch = nameQuery && item.name.toLowerCase().includes(nameQuery);
      const mobileMatch = normalizedCustomerMobile && item.mobile.replace(/\D/g, '').includes(normalizedCustomerMobile);
      return Boolean(nameMatch || mobileMatch);
    });
  }, [customers, deferredCustomerMobile, deferredCustomerName, normalizedCustomerMobile]);

  const exactCustomerMatch = useMemo(() => {
    const exactMobile = normalizedCustomerMobile ? findCustomerByMobile(normalizedCustomerMobile) : undefined;
    if (exactMobile) return exactMobile;

    const nameQuery = deferredCustomerName.trim().toLowerCase();
    if (!nameQuery) return undefined;

    return customers.find((item) => item.name.trim().toLowerCase() === nameQuery);
  }, [customers, deferredCustomerName, normalizedCustomerMobile]);

  useEffect(() => {
    setProducts(loadProducts());
    setCustomers(loadCustomers());
    const onStorage = () => {
      setProducts(loadProducts());
      setCustomers(loadCustomers());
    };
    window.addEventListener('storage', onStorage);
    const onFocus = () => {
      setProducts(loadProducts());
      setCustomers(loadCustomers());
    };
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const generateUniqueInvoiceNumber = async () => {
    const existingNumbers = new Set((await listInvoices()).map((invoice) => invoice.invoiceNumber));
    let candidate = '';

    do {
      candidate = `ISRA-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (existingNumbers.has(candidate));

    return candidate;
  };

  const generatePDFFile = async (invoice: Invoice): Promise<File | null> => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const docElement = document.getElementById('invoice-document');
      if (!docElement) return null;

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
    } catch (err) {
      console.error('PDF generation error:', err);
      return null;
    }
  };

  const prepareAndUploadPdf = async (invoice: Invoice) => {
    setIsPreparingPdf(true);
    setPdfUploadStatus('uploading');

    try {
      const file = await generatePDFFile(invoice);
      if (!file) {
        throw new Error('PDF generation failed');
      }

      const upload = await uploadInvoicePdf(file, invoice.invoiceNumber);
      const updatedInvoice: Invoice = {
        ...invoice,
        pdfUrl: upload.pdfUrl,
        pdfPublicId: upload.pdfPublicId,
        pdfUploadStatus: 'uploaded',
      };

      setSuccessInvoice(updatedInvoice);
      setPdfUploadStatus('uploaded');
      await upsertInvoice(updatedInvoice);
      return updatedInvoice;
    } catch (err) {
      console.error('PDF upload error:', err);
      const failedInvoice: Invoice = {
        ...invoice,
        pdfUploadStatus: 'failed',
      };
      setSuccessInvoice(failedInvoice);
      setPdfUploadStatus('failed');
      await upsertInvoice(failedInvoice);
      toast({
        variant: 'destructive',
        title: 'PDF Upload Failed',
        description: 'The invoice PDF could not be uploaded. You can retry sharing it.',
      });
      return null;
    } finally {
      setIsPreparingPdf(false);
    }
  };

  const loadSuggestions = async (cust: Customer) => {
    try {
      const suggestions = await customerPurchaseSuggestions({
        customerId: cust.id,
        purchaseHistory: [
          { productId: '1', productName: 'Banarasi Silk Saree', category: 'Saree', quantity: 1, price: 4500 }
        ],
        currentInventory: products.map(p => ({
          productId: p.id,
          productName: p.name,
          category: p.category,
          sellingPrice: p.sellingPrice,
          stockQuantity: p.stockQuantity
        }))
      });
      setAiSuggestions(suggestions.suggestions);
    } catch (e) {
      console.error("AI Error:", e);
    }
  };

  const addItem = (product: Product) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price - i.discount } : i));
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.sellingPrice,
        discount: 0,
        total: product.sellingPrice
      }]);
    }
    setSearchTerm('');
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.productId !== id));

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalDiscount = items.reduce((acc, item) => acc + item.discount, 0);
  const grandTotal = subtotal - totalDiscount;

  const handleGenerateInvoice = async () => {
    if (!customer.name || !customer.mobile || items.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Missing customer details or products." });
      return;
    }

    setIsGenerating(true);
    setPdfUploadStatus('uploading');
    setIsPreparingPdf(true);
    const invoiceNumber = await generateUniqueInvoiceNumber();
    const today = new Date().toISOString().split('T')[0];
    const matchedCustomer =
      exactCustomerMatch ??
      customers.find((item) => item.name.trim().toLowerCase() === (customer.name ?? '').trim().toLowerCase()) ??
      findCustomerByMobile(customer.mobile || '');

    const savedCustomer = upsertCustomer({
      id: matchedCustomer?.id,
      name: customer.name!.trim(),
      mobile: customer.mobile!.trim(),
      address: customer.address?.trim() || matchedCustomer?.address || '',
      notes: matchedCustomer?.notes,
      totalOrders: (matchedCustomer?.totalOrders ?? 0) + 1,
      lastPurchaseDate: today,
    });

    setCustomers(loadCustomers());
    setCustomer(savedCustomer);
    setIsExistingCustomer(true);
    loadSuggestions(savedCustomer);
    const invoice: Invoice = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      customerId: savedCustomer.id,
      customerName: savedCustomer.name,
      customerMobile: savedCustomer.mobile,
      customerAddress: savedCustomer.address || '',
      items,
      subtotal,
      totalDiscount,
      grandTotal,
      pdfUploadStatus: 'pending',
    };

    await upsertInvoice(invoice);
    setSuccessInvoice(invoice);
    await prepareAndUploadPdf(invoice);
    setIsGenerating(false);
  };

  const handleSelectCustomer = (selected: Customer) => {
    setCustomer(selected);
    setIsExistingCustomer(true);
    loadSuggestions(selected);
    toast({
      title: 'Customer selected',
      description: `${selected.name} has been filled in for this invoice.`,
    });
  };

  const handleAddAsNewCustomer = () => {
    if (!customer.name?.trim() || !customer.mobile?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing details',
        description: 'Enter customer name and mobile number first.',
      });
      return;
    }

    const saved = addCustomer({
      name: customer.name.trim(),
      mobile: customer.mobile.trim(),
      address: customer.address?.trim() || '',
      notes: '',
    });

    setCustomers(loadCustomers());
    setCustomer(saved);
    setIsExistingCustomer(true);
    loadSuggestions(saved);
    toast({
      title: 'Customer added',
      description: `${saved.name} is now saved in the registry.`,
    });
  };

  const downloadPDF = async () => {
    if (!successInvoice) return;

    const file = await generatePDFFile(successInvoice);

    if (!file) {
      toast({
        variant: 'destructive',
        title: 'PDF Not Ready',
        description: 'Please wait until the invoice PDF finishes generating.',
      });
      return;
    }

    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const retryUpload = async () => {
    if (!successInvoice) return;
    await prepareAndUploadPdf(successInvoice);
  };

  const handleShare = async () => {
    if (!successInvoice) return;

    if (pdfUploadStatus !== 'uploaded' || !successInvoice.pdfUrl) {
      toast({
        variant: 'destructive',
        title: 'PDF Not Ready',
        description: 'WhatsApp sharing is disabled until the public PDF upload succeeds.',
      });
      return;
    }

    const message = buildShareMessage(successInvoice);
    window.open(buildWhatsAppUrl(successInvoice.customerMobile, message), '_blank');
  };

  if (successInvoice) {
    return (
      <Shell>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <Save className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-headline font-bold text-primary">Invoice Generated</h1>
            <p className="text-muted-foreground">Order Ref: <span className="font-bold text-primary">{successInvoice.invoiceNumber}</span></p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
               <div className="p-4 bg-white rounded-lg shadow-sm text-left">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Customer</p>
                  <p className="font-bold truncate">{successInvoice.customerName}</p>
               </div>
               <div className="p-4 bg-white rounded-lg shadow-sm text-left">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Amount</p>
                  <p className="font-bold text-secondary">{formatCurrency(successInvoice.grandTotal)}</p>
               </div>
               <div className="p-4 bg-white rounded-lg shadow-sm text-left">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Items</p>
                  <p className="font-bold">{successInvoice.items.length}</p>
               </div>
               <div className="p-4 bg-white rounded-lg shadow-sm text-left">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Date</p>
                  <p className="font-bold">{successInvoice.date}</p>
               </div>
            </div>

            <div className="rounded-xl border bg-white/80 p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Public PDF</p>
              <p className="mt-1 text-sm">
                {pdfUploadStatus === 'uploaded' && successInvoice.pdfUrl
                  ? successInvoice.pdfUrl
                  : pdfUploadStatus === 'failed'
                    ? 'Upload failed. You can retry below.'
                    : 'Generating and uploading public PDF link...'}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center mt-8">
              <Button onClick={downloadPDF} size="lg" className="bg-primary shadow-lg" disabled={!successInvoice}>
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
              <Button
                onClick={handleShare}
                size="lg"
                className="bg-[#25D366] hover:bg-[#25D366]/90 shadow-lg text-white"
                disabled={pdfUploadStatus !== 'uploaded' || isPreparingPdf || !successInvoice.pdfUrl}
              >
                <Share2 className="h-4 w-4 mr-2" /> {isPreparingPdf ? 'Preparing PDF...' : 'Share to WhatsApp'}
              </Button>
              {pdfUploadStatus === 'failed' && (
                <Button variant="outline" size="lg" onClick={retryUpload} disabled={isPreparingPdf}>
                  Retry Upload
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={() => setSuccessInvoice(null)}>Create New Invoice</Button>
            </div>
          </div>

          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <InvoicePDF 
              invoice={successInvoice} 
              settings={{
                name: "ISRA Ethnics",
                address: "Thekkummuri, Tirur",
                phone1: "8113081120",
                phone2: "9961264495",
                instagram: "@isra.ethnic",
                thankYouMessage: "Happy Shopping!"
              }} 
            />
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline">Product Selection</CardTitle>
              <Badge variant="secondary" className="bg-secondary/10 text-secondary">Rapid Billing</Badge>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-10 h-12"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {deferredSearchTerm && (
                  <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {products.filter(p => p.name.toLowerCase().includes(deferredSearchTerm.toLowerCase())).map(p => (
                      <div 
                        key={p.id} 
                        className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b"
                        onClick={() => addItem(p)}
                      >
                        <div>
                          <p className="font-bold">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.category} • {formatCurrency(p.sellingPrice)}</p>
                        </div>
                        <Badge>{p.stockQuantity} in stock</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground bg-slate-50 rounded-xl border-2 border-dashed">
                    <ShoppingCart className="mx-auto h-12 w-12 opacity-20 mb-2" />
                    <p>No products added yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-2 font-bold uppercase text-[10px] tracking-widest">Product</th>
                          <th className="pb-2 text-center font-bold uppercase text-[10px] tracking-widest">Qty</th>
                          <th className="pb-2 text-right font-bold uppercase text-[10px] tracking-widest">Price</th>
                          <th className="pb-2 text-right font-bold uppercase text-[10px] tracking-widest">Disc</th>
                          <th className="pb-2 text-right font-bold uppercase text-[10px] tracking-widest">Total</th>
                          <th className="pb-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.productId} className="border-b last:border-0">
                            <td className="py-4">
                              <p className="font-bold">{item.productName}</p>
                            </td>
                            <td className="py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={() => setItems(items.map(i => i.productId === item.productId ? { ...i, quantity: Math.max(1, i.quantity - 1), total: Math.max(1, i.quantity - 1) * i.price - i.discount } : i))}
                                >-</Button>
                                <span className="w-4 text-center">{item.quantity}</span>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={() => setItems(items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price - i.discount } : i))}
                                >+</Button>
                              </div>
                            </td>
                            <td className="py-4 text-right">{formatCurrency(item.price)}</td>
                            <td className="py-4 text-right">
                              <Input 
                                type="number" 
                                className="w-16 h-8 text-right p-1 ml-auto" 
                                value={item.discount}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setItems(items.map(i => i.productId === item.productId ? { ...i, discount: val, total: i.quantity * i.price - val } : i));
                                }}
                              />
                            </td>
                            <td className="py-4 text-right font-bold">{formatCurrency(item.total)}</td>
                            <td className="py-4 text-right">
                              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeItem(item.productId)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {aiSuggestions.length > 0 && (
            <Card className="border-none shadow-md bg-white overflow-hidden">
               <div className="bg-primary/5 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-secondary" />
                    <h3 className="font-headline font-bold text-primary">Smart Recommendations</h3>
                  </div>
                  <Badge className="bg-secondary">AI POWERED</Badge>
               </div>
               <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiSuggestions.map((sug, idx) => {
                      const prod = products.find(p => p.id === sug.productId);
                      return prod ? (
                        <div key={idx} className="p-3 border rounded-lg hover:border-secondary transition-colors group">
                           <p className="font-bold text-sm truncate">{sug.productName}</p>
                           <p className="text-[10px] text-muted-foreground uppercase">{sug.category}</p>
                           <p className="text-xs mt-2 italic text-slate-500 line-clamp-2">{sug.reason}</p>
                           <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full mt-3 text-secondary border-t rounded-none group-hover:bg-secondary group-hover:text-white"
                            onClick={() => addItem(prod)}
                           >
                            <Plus className="h-3 w-3 mr-1" /> Add to Cart
                           </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
               </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline flex items-center gap-2">
                <User className="h-5 w-5" /> Customer Info
              </CardTitle>
              {customer.name || customer.mobile ? (
                <Badge variant={isExistingCustomer ? 'secondary' : 'outline'} className={isExistingCustomer ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                  {isExistingCustomer ? <UserCheck className="h-3 w-3 mr-1" /> : <UserPlus className="h-3 w-3 mr-1" />}
                  {isExistingCustomer ? 'Registered' : 'New Customer'}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="mobile" 
                    placeholder="10 digit mobile..." 
                    className="pl-10"
                    value={customer.mobile}
                    onChange={(e) => setCustomer({ ...customer, mobile: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input 
                  id="name" 
                  placeholder="Full Name" 
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input 
                  id="address" 
                  placeholder="City/Area" 
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                />
              </div>

              {(customer.name || customer.mobile) && (
                <div className="rounded-xl border bg-slate-50 p-4 space-y-3">
                  {customerMatches.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        Already registered, please select
                      </div>
                      <div className="space-y-2">
                        {customerMatches.slice(0, 4).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="w-full rounded-lg border bg-white px-3 py-2 text-left transition-colors hover:border-secondary hover:bg-secondary/5"
                            onClick={() => handleSelectCustomer(item)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.mobile}</p>
                              </div>
                              <Badge variant="outline">Select</Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                          <UserPlus className="h-4 w-4" />
                          No match found. Add as new customer.
                      </div>
                      <Button variant="outline" className="w-full" onClick={handleAddAsNewCustomer}>
                        Add as New Customer
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-primary text-white">
            <CardHeader>
              <CardTitle className="font-headline text-white">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 border-b border-white/20 pb-4">
                <div className="flex justify-between">
                  <span className="text-white/70">Subtotal</span>
                  <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Total Discount</span>
                  <span className="font-bold text-green-400">-{formatCurrency(totalDiscount)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xl font-bold">Total Amount</span>
                <span className="text-3xl font-bold text-secondary">{formatCurrency(grandTotal)}</span>
              </div>
              <Button 
                className="w-full bg-secondary hover:bg-secondary/90 h-14 text-lg shadow-xl text-white"
                onClick={handleGenerateInvoice}
                disabled={isGenerating}
              >
                {isGenerating ? "Processing..." : "Generate Invoice"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
