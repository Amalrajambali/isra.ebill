
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Eye, Download, MessageSquare, Calendar } from 'lucide-react';
import { INITIAL_INVOICES } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';

export default function InvoiceHistory() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = INITIAL_INVOICES.filter(inv => 
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Transaction History</h1>
          <p className="text-muted-foreground">Review and manage past boutique orders.</p>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
             <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by Invoice #, Customer or Phone..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" className="flex-1 md:w-auto">
                    <Calendar className="mr-2 h-4 w-4" /> This Month
                   </Button>
                   <Button variant="outline" className="flex-1 md:w-auto">
                    <Filter className="mr-2 h-4 w-4" /> More Filters
                   </Button>
                </div>
             </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b bg-slate-50">
                  <tr>
                    <th className="text-left p-4">Invoice Details</th>
                    <th className="text-left p-4">Customer</th>
                    <th className="text-right p-4">Total Amount</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-primary">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(inv.date)}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold">{inv.customerName}</p>
                        <p className="text-xs text-muted-foreground">{inv.customerMobile}</p>
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-bold text-secondary">{formatCurrency(inv.grandTotal)}</p>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0">PAID</Badge>
                      </td>
                      <td className="p-4 text-right">
                         <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="View Details"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Download PDF"><Download className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Send WhatsApp" className="text-[#25D366]"><MessageSquare className="h-4 w-4" /></Button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p>No matching transactions found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
