
"use client";

import React from 'react';
import { Invoice, ShopSettings } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface InvoicePDFProps {
  invoice: Invoice;
  settings: ShopSettings;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, settings }) => {
  return (
    <div 
      id="invoice-document"
      className="bg-white p-12 w-[210mm] min-h-[297mm] mx-auto text-slate-800 font-sans shadow-lg"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Header Section */}
      <div className="flex justify-between items-start border-b-2 border-primary pb-8 mb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold text-primary tracking-tight">ISRA ETHNICS</h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Boutique & Fashion Studio</p>
          <div className="mt-4 text-sm leading-relaxed text-slate-600">
            <p>{settings.address}</p>
            <p>Ph: {settings.phone1}, {settings.phone2}</p>
            <p className="text-primary font-semibold">Instagram: {settings.instagram}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-primary text-white px-6 py-2 inline-block rounded-sm mb-4">
            <h2 className="text-lg font-bold tracking-widest uppercase">Invoice</h2>
          </div>
          <p className="text-sm"><span className="text-slate-500">Invoice No:</span> <span className="font-bold">{invoice.invoiceNumber}</span></p>
          <p className="text-sm"><span className="text-slate-500">Date:</span> <span className="font-bold">{formatDate(invoice.date)}</span></p>
        </div>
      </div>

      {/* Customer Info Section */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b pb-1">Billed To</h3>
          <div className="text-sm space-y-1">
            <p className="text-lg font-bold">{invoice.customerName}</p>
            <p className="text-slate-600">{invoice.customerMobile}</p>
            <p className="text-slate-600 max-w-xs">{invoice.customerAddress}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-12">
        <thead>
          <tr className="bg-slate-50 border-y border-slate-200">
            <th className="text-left py-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
            <th className="text-center py-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Price</th>
            <th className="text-center py-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Qty</th>
            <th className="text-center py-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Discount</th>
            <th className="text-right py-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoice.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-4 px-3">
                <p className="font-bold text-slate-800">{item.productName}</p>
                <p className="text-xs text-slate-500">Premium Collection</p>
              </td>
              <td className="py-4 px-3 text-center text-sm font-medium">{formatCurrency(item.price)}</td>
              <td className="py-4 px-3 text-center text-sm font-medium">{item.quantity}</td>
              <td className="py-4 px-3 text-center text-sm font-medium">{item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
              <td className="py-4 px-3 text-right text-sm font-bold">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="flex justify-end mb-16">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Total Discount</span>
            <span className="font-semibold text-green-600">-{formatCurrency(invoice.totalDiscount)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t-2 border-primary text-xl font-bold text-primary">
            <span>Grand Total</span>
            <span>{formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="border-t pt-8 mt-auto">
        <div className="text-center space-y-4">
          <div className="font-serif italic text-lg text-primary">
            "Dear Customer, Thank you for shopping with ISRA Ethnics. Your invoice is attached. Happy Shopping! insta id @isra.ethnic"
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
            Visit us again for the latest Saree & Churidar collections
          </div>
        </div>
      </div>
    </div>
  );
};
