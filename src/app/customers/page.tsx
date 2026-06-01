"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus, Search, Phone, MapPin, History, Sparkles, Save, X } from 'lucide-react';
import { Customer } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { addCustomer, loadCustomers } from '@/lib/customer-store';
import { useToast } from '@/hooks/use-toast';

type CustomerDraft = {
  name: string;
  mobile: string;
  address: string;
};

const emptyDraft: CustomerDraft = {
  name: '',
  mobile: '',
  address: '',
};

export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft);

  useEffect(() => {
    const fetchCustomers = async () => setCustomers(await loadCustomers());
    fetchCustomers();

    const onFocus = () => fetchCustomers();
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        const query = searchTerm.toLowerCase();
        return c.name.toLowerCase().includes(query) || c.mobile.includes(searchTerm);
      }),
    [customers, searchTerm],
  );

  const openAddDialog = () => {
    setDraft(emptyDraft);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim() || !draft.mobile.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing details',
        description: 'Please enter both customer name and mobile number.',
      });
      return;
    }

    const next = await addCustomer({
      name: draft.name.trim(),
      mobile: draft.mobile.trim(),
      address: draft.address.trim(),
      notes: '',
    });

    setCustomers(await loadCustomers());
    setDialogOpen(false);
    setDraft(emptyDraft);
    toast({
      title: 'Customer saved',
      description: `${next.name} has been added to the registry.`,
    });
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Customer Registry</h1>
            <p className="text-muted-foreground">Manage relationships and shopper preferences.</p>
          </div>
          <Button className="bg-secondary shadow-lg" onClick={openAddDialog}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or mobile number..."
            className="pl-10 h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <Card key={c.id} className="border-none shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-2 bg-primary"></div>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                      {c.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg leading-none">{c.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" /> {c.mobile}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-secondary" />
                    <p className="line-clamp-2">{c.address || 'No address added'}</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t mt-4">
                    <div className="text-center flex-1 border-r">
                      <p className="text-xs text-muted-foreground uppercase">Orders</p>
                      <p className="font-bold text-primary">{c.totalOrders}</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-xs text-muted-foreground uppercase">Last Visit</p>
                      <p className="font-bold text-primary">{c.lastPurchaseDate || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button variant="outline" size="sm" className="flex-1">
                    <History className="mr-1 h-3 w-3" /> History
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1">
                    <Sparkles className="mr-1 h-3 w-3" /> Insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border-2 border-dashed py-16 text-center text-muted-foreground">
            <Search className="mx-auto mb-3 h-12 w-12 opacity-20" />
            <p>No matching customers found.</p>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="font-headline">Add Customer</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  value={draft.name}
                  onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer-mobile">Mobile Number</Label>
                <Input
                  id="customer-mobile"
                  value={draft.mobile}
                  onChange={(e) => setDraft((current) => ({ ...current, mobile: e.target.value }))}
                  placeholder="10 digit mobile number"
                  inputMode="numeric"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer-address">Address</Label>
                <Input
                  id="customer-address"
                  value={draft.address}
                  onChange={(e) => setDraft((current) => ({ ...current, address: e.target.value }))}
                  placeholder="Area, City"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button className="w-full bg-primary sm:w-auto" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Save Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
