"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Edit3, Trash2, AlertTriangle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { Product, Category } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { addProduct, deleteProduct, loadProducts, updateProduct } from '@/lib/product-store';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES: Category[] = ['Churidar', 'Saree', 'Kurti', 'Dupatta', 'Shawl', 'Other'];

type ProductDraft = {
  id?: string;
  name: string;
  category: Category;
  sellingPrice: string;
  stockQuantity: string;
};

const emptyDraft: ProductDraft = {
  name: '',
  category: 'Saree',
  sellingPrice: '',
  stockQuantity: '',
};

export default function AddProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    const fetchProducts = async () => setProducts(await loadProducts());
    fetchProducts();

    const onFocus = () => {
      fetchProducts();
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
          p.id.includes(deferredSearchTerm),
      ),
    [products, deferredSearchTerm],
  );

  const openAddDialog = () => {
    setDraft(emptyDraft);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setDraft({
      id: product.id,
      name: product.name,
      category: product.category,
      sellingPrice: String(product.sellingPrice),
      stockQuantity: String(product.stockQuantity),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing name',
        description: 'Please enter a product name.',
      });
      return;
    }

    const nextProduct = {
      name: draft.name.trim(),
      category: draft.category,
      sellingPrice: Number(draft.sellingPrice) || 0,
      stockQuantity: Number(draft.stockQuantity) || 0,
    };

    const nextProducts = draft.id
      ? await updateProduct({ ...nextProduct, id: draft.id })
      : await addProduct(nextProduct);

    setProducts(nextProducts);
    setDialogOpen(false);
    setDraft(emptyDraft);
    toast({
      title: draft.id ? 'Product updated' : 'Product added',
      description: `${nextProduct.name} has been saved successfully.`,
    });
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;

    const nextProducts = await deleteProduct(product.id);
    setProducts(nextProducts);
    toast({
      title: 'Product deleted',
      description: `${product.name} was removed from inventory.`,
    });
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold">Add Products</h1>
            <p className="text-muted-foreground">Manage boutique products, stock, and pricing from one place.</p>
          </div>
          <Button className="bg-secondary shadow-lg" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, category or ID..."
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="md:w-auto">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((p) => (
            <Card key={p.id} className="group overflow-hidden border-none shadow-md transition-shadow hover:shadow-lg">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{p.category}</Badge>
                  {p.stockQuantity < 5 && <Badge variant="destructive">LOW STOCK</Badge>}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold leading-none">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">ID: #ISRA-{p.id.padStart(4, '0')}</p>
                  </div>
                  <p className="shrink-0 text-lg font-bold text-secondary">{formatCurrency(p.sellingPrice)}</p>
                </div>

                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        p.stockQuantity > 10 ? 'bg-green-500' : p.stockQuantity > 5 ? 'bg-amber-500' : 'bg-destructive',
                      )}
                    />
                    <span className="text-sm font-medium">Stock: {p.stockQuantity} Units</span>
                  </div>
                  {p.stockQuantity < 5 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => openEditDialog(p)}>
                    <Edit3 className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="rounded-xl border-2 border-dashed py-16 text-center text-muted-foreground">
            <Package className="mx-auto mb-3 h-12 w-12 opacity-20" />
            <p>No matching products found.</p>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle className="font-headline">{draft.id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={draft.name}
                  onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
                  placeholder="e.g. Silk Saree with Embroidery"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={draft.category}
                    onValueChange={(value) => setDraft((current) => ({ ...current, category: value as Category }))}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="price">Selling Price</Label>
                  <Input
                    id="price"
                    type="number"
                    inputMode="numeric"
                    value={draft.sellingPrice}
                    onChange={(e) => setDraft((current) => ({ ...current, sellingPrice: e.target.value }))}
                    placeholder="4500"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="stock">Initial Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  inputMode="numeric"
                  value={draft.stockQuantity}
                  onChange={(e) => setDraft((current) => ({ ...current, stockQuantity: e.target.value }))}
                  placeholder="10"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button className="w-full bg-primary sm:w-auto" onClick={handleSave}>
                {draft.id ? 'Save Changes' : 'Add to Inventory'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
