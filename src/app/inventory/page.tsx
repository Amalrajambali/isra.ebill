
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Edit3, Trash2, AlertTriangle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { INITIAL_PRODUCTS } from '@/lib/mock-data';
import { Product, Category } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const CATEGORIES: Category[] = ['Churidar', 'Saree', 'Kurti', 'Dupatta', 'Shawl', 'Other'];

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Inventory Control</h1>
            <p className="text-muted-foreground">Manage your boutique collections and stock levels.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-secondary shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-headline">Add New Collection Item</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" placeholder="e.g. Silk Saree with Embroidery" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Selling Price</Label>
                    <Input id="price" type="number" placeholder="4500" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Initial Stock</Label>
                  <Input id="stock" type="number" placeholder="10" />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full bg-primary">Add to Inventory</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, category or ID..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="md:w-auto">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <Card key={p.id} className="border-none shadow-md hover:shadow-lg transition-shadow overflow-hidden group">
              <div className="relative h-48 bg-slate-100 flex items-center justify-center">
                 <Package className="h-16 w-16 text-slate-300 group-hover:scale-110 transition-transform" />
                 {p.stockQuantity < 5 && (
                    <Badge variant="destructive" className="absolute top-2 right-2 animate-pulse">LOW STOCK</Badge>
                 )}
                 <Badge className="absolute bottom-2 left-2 bg-white text-primary hover:bg-white">{p.category}</Badge>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg leading-none">{p.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">ID: #ISRA-{p.id.padStart(4, '0')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-secondary">{formatCurrency(p.sellingPrice)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-y">
                   <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        p.stockQuantity > 10 ? "bg-green-500" : p.stockQuantity > 5 ? "bg-amber-500" : "bg-destructive"
                      )}></div>
                      <span className="text-sm font-medium">Stock: {p.stockQuantity} Units</span>
                   </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit3 className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:bg-destructive/10">
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
