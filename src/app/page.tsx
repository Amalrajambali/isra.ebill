
"use client";

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Package, IndianRupee, AlertCircle, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { loadProducts } from '@/lib/product-store';
import { loadCustomers } from '@/lib/customer-store';
import { listInvoices } from '@/lib/invoice-api';
import type { Product, Customer, Invoice } from '@/lib/types';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      const [nextProducts, nextCustomers, nextInvoices] = await Promise.all([
        loadProducts(),
        loadCustomers(),
        listInvoices(),
      ]);

      setProducts(nextProducts);
      setCustomers(nextCustomers);
      setInvoices(nextInvoices);
    };

    fetchDashboard();
  }, []);

  const totalSales = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const lowStockCount = products.filter((p) => p.stockQuantity < 5).length;

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Store Overview</h1>
            <p className="text-muted-foreground mt-1">Welcome back, ISRA Ethnics Manager.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/billing">
              <Button className="bg-secondary hover:bg-secondary/90 shadow-lg">
                <ShoppingBag className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalSales)}</div>
              <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">Active shoppers</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
              <Package className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">{products.reduce((total: number, product: Product) => total + product.stockQuantity, 0)} units in stock</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{lowStockCount}</div>
              <p className="text-xs text-destructive mt-1">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="font-headline">Recent Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 border-b last:border-0">
                    <div>
                      <p className="font-bold text-primary">{inv.customerName}</p>
                      <p className="text-xs text-muted-foreground">{inv.invoiceNumber} • {inv.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(inv.grandTotal)}</p>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Paid</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-secondary" asChild>
                <Link href="/history">View All Activity</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="font-headline">Inventory Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.filter(p => p.stockQuantity < 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border-b last:border-0">
                    <div>
                      <p className="font-bold text-primary">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold",
                        p.stockQuantity < 5 ? "text-destructive" : "text-amber-500"
                      )}>{p.stockQuantity} Left</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-secondary" asChild>
                <Link href="/inventory">Manage Inventory</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
