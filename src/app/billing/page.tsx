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
import { buildInvoicePdfUrl, buildShareMessage, buildWhatsAppUrl, downloadInvoicePdf } from '@/lib/invoice-share';
import { listInvoices, upsertInvoice } from '@/lib/invoice-api';
import { adjustProductStock, loadProducts } from '@/lib/product-store';
import { addCustomer, loadCustomers, upsertCustomer } from '@/lib/customer-store';

export default function NewInvoice() {
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Partial<Customer>>({ name: '', mobile: '', address: '' });
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState<Invoice | null>(null);
  const [pdfUploadStatus, setPdfUploadStatus] = useState<'idle' | 'uploaded'>('idle');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const deferredCustomerSearchTerm = useDeferredValue(customerSearchTerm);
  const deferredCustomerName = useDeferredValue(customer.name ?? '');
  const deferredCustomerMobile = useDeferredValue(customer.mobile ?? '');

  const searchMatches = useMemo(() => {
    const query = deferredCustomerSearchTerm.trim().toLowerCase();
    if (!query) return [];
    const normalizedQuery = query.replace(/\D/g, '');
    return customers.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(query);
      const mobileMatch = normalizedQuery && item.mobile.replace(/\D/g, '').includes(normalizedQuery);
      return Boolean(nameMatch || mobileMatch);
    });
  }, [customers, deferredCustomerSearchTerm]);

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
    const exactMobile = normalizedCustomerMobile
      ? customers.find((item) => item.mobile.replace(/\D/g, '') === normalizedCustomerMobile)
      : undefined;
    if (exactMobile) return exactMobile;

    const nameQuery = deferredCustomerName.trim().toLowerCase();
    if (!nameQuery) return undefined;

    return customers.find((item) => item.name.trim().toLowerCase() === nameQuery);
  }, [customers, deferredCustomerName, normalizedCustomerMobile]);

  useEffect(() => {
    const fetchData = async () => {
      const [nextProducts, nextCustomers] = await Promise.all([loadProducts(), loadCustomers()]);
      setProducts(nextProducts);
      setCustomers(nextCustomers);
    };

    fetchData();
    const onFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', onFocus);
    return () => {
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
    const normalizedMobile = (customer.mobile || '').replace(/\D/g, '');
    if (!customer.name || !customer.mobile || items.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Missing customer details or products." });
      return;
    }

    if (normalizedMobile.length !== 10) {
      toast({ variant: "destructive", title: "Invalid mobile number", description: "Customer mobile must be exactly 10 digits." });
      return;
    }

    setIsGenerating(true);
    const invoiceNumber = await generateUniqueInvoiceNumber();
    const pdfUrl = buildInvoicePdfUrl(invoiceNumber, window.location.origin);
    const today = new Date().toISOString().split('T')[0];
    const matchedCustomer =
      exactCustomerMatch ??
      customers.find((item) => item.name.trim().toLowerCase() === (customer.name ?? '').trim().toLowerCase()) ??
      customers.find((item) => item.mobile.replace(/\D/g, '') === normalizedMobile);

    const savedCustomer = await upsertCustomer({
      id: matchedCustomer?.id,
      name: customer.name!.trim(),
      mobile: normalizedMobile,
      address: customer.address?.trim() || matchedCustomer?.address || '',
      notes: matchedCustomer?.notes,
      totalOrders: (matchedCustomer?.totalOrders ?? 0) + 1,
      lastPurchaseDate: today,
    });

    setCustomers(await loadCustomers());
    setCustomer(savedCustomer);
    setIsExistingCustomer(true);
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
      pdfUrl,
      pdfUploadStatus: 'uploaded',
    };

    await upsertInvoice(invoice);
    await adjustProductStock(items.map((item) => ({ productId: item.productId, delta: -item.quantity })));
    setProducts(await loadProducts());
    setSuccessInvoice(invoice);
    setPdfUploadStatus('uploaded');
    setIsGenerating(false);
  };

  const handleSelectCustomer = (selected: Customer) => {
    setCustomer(selected);
    setIsExistingCustomer(true);
    toast({
      title: 'Customer selected',
      description: `${selected.name} has been filled in for this invoice.`,
    });
  };

  const handleAddAsNewCustomer = async () => {
    const normalizedMobile = (customer.mobile || '').replace(/\D/g, '');

    if (!customer.name?.trim() || !customer.mobile?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing details',
        description: 'Enter customer name and mobile number first.',
      });
      return;
    }

    if (normalizedMobile.length !== 10) {
      toast({
        variant: 'destructive',
        title: 'Invalid mobile number',
        description: 'Mobile number must be exactly 10 digits.',
      });
      return;
    }

    const saved = await addCustomer({
      name: customer.name.trim(),
      mobile: normalizedMobile,
      address: customer.address?.trim() || '',
      notes: '',
    });

    setCustomers(await loadCustomers());
    setCustomer(saved);
    setIsExistingCustomer(true);
    toast({
      title: 'Customer added',
      description: `${saved.name} is now saved in the registry.`,
    });
  };

  const downloadPDF = async () => {
    if (!successInvoice) return;
    if (!successInvoice.pdfUrl) {
      toast({
        variant: 'destructive',
        title: 'PDF Not Ready',
        description: 'The public PDF link is not ready yet.',
      });
      return;
    }

    downloadInvoicePdf(successInvoice);
  };

  const handleShare = async () => {
    if (!successInvoice) return;

    if (pdfUploadStatus !== 'uploaded' || !successInvoice.pdfUrl) {
      toast({
        variant: 'destructive',
        title: 'PDF Not Ready',
        description: 'WhatsApp sharing is disabled until the public PDF link is ready.',
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
                {successInvoice.pdfUrl || 'Generating public PDF link...'}
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
                disabled={pdfUploadStatus !== 'uploaded' || !successInvoice.pdfUrl}
              >
                <Share2 className="h-4 w-4 mr-2" /> Share to WhatsApp
              </Button>
              <Button variant="outline" size="lg" onClick={() => setSuccessInvoice(null)}>Create New Invoice</Button>
            </div>
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
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline flex items-center gap-2">
                <User className="h-5 w-5" /> Customer Info
              </CardTitle>
              {customer.name || customer.mobile ? (
                <div className="flex items-center gap-2">
                  <Badge variant={isExistingCustomer ? 'secondary' : 'outline'} className={isExistingCustomer ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                    {isExistingCustomer ? <UserCheck className="h-3 w-3 mr-1" /> : <UserPlus className="h-3 w-3 mr-1" />}
                    {isExistingCustomer ? 'Registered' : 'New Customer'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setCustomer({ name: '', mobile: '', address: '' });
                      setIsExistingCustomer(false);
                      setCustomerSearchTerm('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Customer Bar */}
              <div className="space-y-2">
                <Label htmlFor="customer-search" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Search Registered Customer</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customer-search"
                    placeholder="Search by name or mobile number..."
                    className="pl-10 h-11"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Already registered result on top */}
              {!isExistingCustomer && (searchMatches.length > 0 || customerMatches.length > 0) && (
                <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <UserCheck className="h-4 w-4 text-secondary" />
                    Already registered, please select
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Array.from(new Map([...searchMatches, ...customerMatches].map(item => [item.id, item])).values())
                      .slice(0, 4)
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full rounded-lg border bg-white px-3 py-2 text-left transition-colors hover:border-secondary hover:bg-secondary/5 flex items-center justify-between gap-3 shadow-sm"
                          onClick={() => {
                            handleSelectCustomer(item);
                            setCustomerSearchTerm('');
                          }}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-primary truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.mobile}</p>
                          </div>
                          <Badge variant="secondary" className="bg-secondary/15 text-secondary hover:bg-secondary/20 border-none text-[10px]">Select</Badge>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 my-4 pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mobile"
                      placeholder="10 digit mobile..."
                      className="pl-10"
                      inputMode="numeric"
                      maxLength={10}
                      value={customer.mobile || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setCustomer({
                          ...customer,
                          mobile: val,
                        });
                        
                        // Auto-link if exact mobile match is typed
                        if (val.length === 10) {
                          const exactMatch = customers.find(c => c.mobile.replace(/\D/g, '') === val);
                          if (exactMatch) {
                            setCustomer(exactMatch);
                            setIsExistingCustomer(true);
                            toast({
                              title: 'Registered customer loaded',
                              description: `${exactMatch.name} has been auto-filled.`,
                            });
                            return;
                          }
                        }
                        setIsExistingCustomer(false);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name</Label>
                  <Input
                    id="name"
                    placeholder="Full Name"
                    value={customer.name || ''}
                    onChange={(e) => {
                      setCustomer({ ...customer, name: e.target.value });
                      setIsExistingCustomer(false);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input
                    id="address"
                    placeholder="City/Area"
                    value={customer.address || ''}
                    onChange={(e) => {
                      setCustomer({ ...customer, address: e.target.value });
                      setIsExistingCustomer(false);
                    }}
                  />
                </div>
              </div>

              {/* Save as New Customer button (only show when name and 10-digit mobile are entered, not already registered, and no matching customer exists) */}
              {!isExistingCustomer && customer.name?.trim() && customer.mobile?.replace(/\D/g, '').length === 10 && customerMatches.length === 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <UserPlus className="h-4 w-4" />
                    New customer details entered.
                  </div>
                  <Button variant="outline" className="w-full border-blue-200 hover:bg-blue-50 text-blue-700 hover:text-blue-800" onClick={handleAddAsNewCustomer}>
                    Add as New Customer
                  </Button>
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
