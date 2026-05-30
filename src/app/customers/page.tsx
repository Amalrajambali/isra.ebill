
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus, Search, Phone, MapPin, History, Sparkles } from 'lucide-react';
import { INITIAL_CUSTOMERS } from '@/lib/mock-data';
import { Customer } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobile.includes(searchTerm)
  );

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Client Registry</h1>
            <p className="text-muted-foreground">Manage relationships and shopper preferences.</p>
          </div>
          <Button className="bg-secondary shadow-lg">
            <UserPlus className="mr-2 h-4 w-4" /> Add New Client
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
                      <p className="line-clamp-2">{c.address}</p>
                   </div>
                   <div className="flex items-center justify-between py-2 border-t mt-4">
                      <div className="text-center flex-1 border-r">
                         <p className="text-xs text-muted-foreground uppercase">Orders</p>
                         <p className="font-bold text-primary">{c.totalOrders}</p>
                      </div>
                      <div className="text-center flex-1">
                         <p className="text-xs text-muted-foreground uppercase">Last Visit</p>
                         <p className="font-bold text-primary">{c.lastPurchaseDate}</p>
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
      </div>
    </Shell>
  );
}
