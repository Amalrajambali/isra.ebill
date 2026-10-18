'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, IndianRupee, TrendingDown, TrendingUp } from 'lucide-react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { listInvoices } from '@/lib/invoice-api';
import type { Invoice } from '@/lib/types';

const getMonthKey = (date: string) => date.slice(0, 7);

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const shiftMonth = (monthKey: string, amount: number) => {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
};

export default function RevenueReports() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);

  useEffect(() => {
    const fetchInvoices = async () => {
      setInvoices(await listInvoices());
      setIsLoading(false);
    };
    fetchInvoices();
  }, []);

  const currentMonth = getCurrentMonthKey();
  const monthOptions = Array.from(new Set([
    currentMonth,
    ...invoices.map((invoice) => getMonthKey(invoice.date)),
  ])).sort().reverse();
  const previousMonth = shiftMonth(selectedMonth, -1);
  const selectedInvoices = invoices.filter((invoice) => getMonthKey(invoice.date) === selectedMonth);
  const previousInvoices = invoices.filter((invoice) => getMonthKey(invoice.date) === previousMonth);
  const totalRevenue = invoices.reduce((total, invoice) => total + invoice.grandTotal, 0);
  const selectedRevenue = selectedInvoices.reduce((total, invoice) => total + invoice.grandTotal, 0);
  const previousRevenue = previousInvoices.reduce((total, invoice) => total + invoice.grandTotal, 0);
  const revenueChange = selectedRevenue - previousRevenue;
  const revenueChangePercent = previousRevenue > 0 ? (revenueChange / previousRevenue) * 100 : null;

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold">Revenue Reports</h1>
            <p className="mt-1 text-muted-foreground">Review monthly sales and compare growth or loss.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </Button>
        </div>

        <Card className="border-none bg-primary text-white shadow-lg">
          <CardContent className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/70">Total Revenue</p>
              <p className="mt-1 text-3xl font-bold">{isLoading ? 'Loading…' : formatCurrency(totalRevenue)}</p>
              <p className="mt-1 text-xs text-white/70">All recorded sales</p>
            </div>
            <IndianRupee className="h-10 w-10 text-secondary" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Calendar className="h-5 w-5 text-secondary" /> Monthly Revenue
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Compare the selected month with {formatMonth(previousMonth)}.</p>
            </div>
            <select
              aria-label="Select revenue month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>{formatMonth(month)}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{formatMonth(selectedMonth)} Revenue</p>
                <p className="mt-2 text-2xl font-bold text-primary">{isLoading ? 'Loading…' : formatCurrency(selectedRevenue)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{selectedInvoices.length} sale{selectedInvoices.length === 1 ? '' : 's'}</p>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Previous Month</p>
                <p className="mt-2 text-2xl font-bold text-primary">{isLoading ? 'Loading…' : formatCurrency(previousRevenue)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatMonth(previousMonth)} · {previousInvoices.length} sale{previousInvoices.length === 1 ? '' : 's'}</p>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Growth / Loss</p>
              <p className={`mt-2 flex items-center gap-2 text-2xl font-bold ${revenueChange >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {revenueChange >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {isLoading ? 'Loading…' : <>{revenueChange >= 0 ? '+' : ''}{formatCurrency(revenueChange)}</>}
              </p>
              <p className={`mt-1 text-xs ${revenueChange >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {isLoading ? 'Loading report…' : revenueChangePercent === null
                  ? (selectedRevenue > 0 ? 'New revenue' : 'No change')
                  : `${revenueChangePercent >= 0 ? '+' : ''}${revenueChangePercent.toFixed(1)}% from previous month`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
