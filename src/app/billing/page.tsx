
"use client";

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Trash2, Save, Sparkles, User, Search, Phone, UserCheck, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from '@/lib/mock-data';
import { InvoiceItem, Customer, Product, Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { customerPurchaseSuggestions } from '@/ai/flows/customer-purchase-suggestions';
import { InvoicePDF } from '@/components/invoice/InvoicePDF';

export default function NewInvoice() {
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Partial<Customer>>({ name: '', mobile: '', address: '' });
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [successInvoice, setSuccessInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (customer.mobile?.length === 10) {
      const existing = INITIAL_CUSTOMERS.find(c => c.mobile === customer.mobile);
      if (existing) {
        setCustomer(existing);
        setIsExistingCustomer(true);
        toast({ title: "Customer Found", description: `Recognized: ${existing.name}` });
        loadSuggestions(existing);
      } else {
        setIsExistingCustomer(false);
        // Clear name/address if previously was an existing customer but now mobile changed to new
        if (isExistingCustomer) {
          setCustomer({ mobile: customer.mobile, name: '', address: '' });
        }
      }
    } else {
      setIsExistingCustomer(false);
    }
  }, [customer.mobile]);

  const loadSuggestions = async (cust: Customer) => {
    try {
      const suggestions = await customerPurchaseSuggestions({
        customerId: cust.id,
        purchaseHistory: [
          { productId: '1', productName: 'Banarasi Silk Saree', category: 'Saree', quantity: 1, price: 4500 }
        ],
        currentInventory: INITIAL_PRODUCTS.map(p => ({
          productId: p.id,
          productName: p.name,
          category: p.category,
          sellingPrice: p.sellingPrice,
          stockQuantity: p.stockQuantity
        }))
      });
      setAiSuggestions(suggestions.suggestions);
    } catch (e) {
      console.error(e);
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
    const invoice: Invoice = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: `ISRA-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      customerId: customer.id || 'new',
      customerName: customer.name!,
      customerMobile: customer.mobile!,
      customerAddress: customer.address || '',
      items,
      subtotal,
      totalDiscount,
      grandTotal
    };

    setSuccessInvoice(invoice);
    setIsGenerating(false);
  };

  const downloadPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const doc = document.getElementById('invoice-document');
      if (!doc) {
        toast({ variant: "destructive", title: "Export Error", description: "Invoice document not found." });
        return;
      }

      const canvas = await html2canvas(doc, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${successInvoice?.invoiceNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate PDF. Please try again." });
    }
  };

  const shareWhatsApp = () => {
    const message = `Dear ${successInvoice?.customerName}, Thank you for shopping with ISRA Ethnics. Your invoice ${successInvoice?.invoiceNumber} for ${formatCurrency(successInvoice?.grandTotal || 0)} is ready. Happy Shopping! @isra.ethnic`;
    window.open(`https://wa.me/91${successInvoice?.customerMobile}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (successInvoice) {
    return (
      <Shell>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <Save className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-headline font-bold text-primary">Invoice Created Successfully</h1>
            <p className="text-muted-foreground">Order Ref: <span className="font-bold text-primary">{successInvoice.invoiceNumber}</span></p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
               <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-xs text-muted-foreground uppercase">Customer</p>
                  <p className="font-bold truncate">{successInvoice.customerName}</p>
               </div>
               <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-xs text-muted-foreground uppercase">Amount</p>
                  <p className="font-bold text-secondary">{formatCurrency(successInvoice.grandTotal)}</p>
               </div>
               <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-xs text-muted-foreground uppercase">Items</p>
                  <p className="font-bold">{successInvoice.items.length}</p>
               </div>
               <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-xs text-muted-foreground uppercase">Date</p>
                  <p className="font-bold">{successInvoice.date}</p>
               </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center mt-8">
              <Button onClick={downloadPDF} size="lg" className="bg-primary shadow-lg">Download PDF</Button>
              <Button onClick={shareWhatsApp} size="lg" className="bg-[#25D366] hover:bg-[#25D366]/90 shadow-lg">Send via WhatsApp</Button>
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
                  placeholder="Search products by name or category..." 
                  className="pl-10 h-12"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {INITIAL_PRODUCTS.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
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
                      const prod = INITIAL_PRODUCTS.find(p => p.id === sug.productId);
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
                <User className="h-5 w-5" /> Customer Details
              </CardTitle>
              {customer.mobile?.length === 10 && (
                <Badge variant={isExistingCustomer ? "secondary" : "outline"} className={isExistingCustomer ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                  {isExistingCustomer ? <UserCheck className="h-3 w-3 mr-1" /> : <UserPlus className="h-3 w-3 mr-1" />}
                  {isExistingCustomer ? "Existing" : "New Shopper"}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="mobile" 
                    placeholder="Search mobile..." 
                    className="pl-10"
                    value={customer.mobile}
                    onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
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
                  disabled={isExistingCustomer}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input 
                  id="address" 
                  placeholder="City/Area" 
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  disabled={isExistingCustomer}
                />
              </div>
              {isExistingCustomer && (
                <Button variant="ghost" size="sm" className="text-xs text-secondary p-0" onClick={() => setIsExistingCustomer(false)}>
                  Not {customer.name}? Click here to add as new customer
                </Button>
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
                className="w-full bg-secondary hover:bg-secondary/90 h-14 text-lg shadow-xl"
                onClick={handleGenerateInvoice}
                disabled={isGenerating}
              >
                {isGenerating ? "Processing..." : "Complete & Generate Invoice"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
