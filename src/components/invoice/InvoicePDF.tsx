
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
      className="mx-auto min-h-[297mm] w-[210mm] bg-white p-10 font-sans text-slate-800 shadow-lg md:p-12"
      style={{ boxSizing: 'border-box' }}
    >
      <div className="mb-10 flex items-start justify-between gap-8 border-b border-slate-800/80 pb-7">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold tracking-tight text-slate-900">ISRA ETHNIC</h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-slate-500">
            Boutique &amp; Fashion Studio
          </p>
          <div className="mt-3 text-sm leading-6 text-slate-600">
            <p>{settings.address}</p>
            <p>Ph: {settings.phone1}, {settings.phone2}</p>
            <p>
              <span className="font-semibold text-slate-800">Instagram:</span> {settings.instagram}
            </p>
          </div>
        </div>

        <div className="min-w-[190px] pt-2 text-right">
          <div className="ml-auto mb-8 h-10 w-32 rounded-md bg-slate-900" />
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-slate-500">Invoice No:</span>{' '}
              <span className="font-bold text-slate-800">{invoice.invoiceNumber}</span>
            </p>
            <p>
              <span className="text-slate-500">Date:</span>{' '}
              <span className="font-semibold text-slate-700">{formatDate(invoice.date)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="inline-block min-w-[180px] border-b border-slate-200 pb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-700">
          Billed To
        </h3>
        <div className="mt-6 text-sm">
          <p className="text-xl font-bold text-slate-900">{invoice.customerName}</p>
          <p className="mt-1 text-slate-600">{invoice.customerMobile}</p>
          <p className="max-w-sm text-slate-600">{invoice.customerAddress}</p>
        </div>
      </div>

      <table className="mb-14 w-full">
        <thead>
          <tr className="border-y border-slate-200 bg-slate-50">
            <th className="px-3 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
              Description
            </th>
            <th className="px-3 py-4 text-center text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
              Price
            </th>
            <th className="px-3 py-4 text-center text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
              Qty
            </th>
            <th className="px-3 py-4 text-center text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
              Discount
            </th>
            <th className="px-3 py-4 text-right text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoice.items.map((item, idx) => (
            <tr key={idx}>
              <td className="px-3 py-5">
                <p className="font-bold text-slate-800">{item.productName}</p>
                <p className="text-xs text-slate-500">Premium Collection</p>
              </td>
              <td className="px-3 py-5 text-center text-sm font-medium">{formatCurrency(item.price)}</td>
              <td className="px-3 py-5 text-center text-sm font-medium">{item.quantity}</td>
              <td className="px-3 py-5 text-center text-sm font-medium">
                {item.discount > 0 ? formatCurrency(item.discount) : '-'}
              </td>
              <td className="px-3 py-5 text-right text-sm font-bold">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-20 flex justify-end">
        <div className="w-72 space-y-3">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Total Discount</span>
            <span className="font-semibold text-green-600">-{formatCurrency(invoice.totalDiscount)}</span>
          </div>
          <div className="border-t-2 border-slate-900 pt-3" />
          <div className="flex items-center justify-between text-2xl font-bold text-slate-900">
            <span>Grand Total</span>
            <span>{formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-10">
        <div className="text-center">
          <div className="font-serif italic text-lg text-slate-800">
            &quot;Thank you for shopping with ISRA Churidars & Sarees. Happy Shopping!&quot;
          </div>
          <div className="mt-3 text-[10px] uppercase tracking-[0.28em] text-slate-400">
            Visit us again for the latest Saree &amp; Churidar collections
          </div>
        </div>
      </div>
    </div>
  );
};
