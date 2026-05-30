
"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Instagram, MapPin, Phone, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({ title: "Settings Saved", description: "Boutique details have been updated successfully." });
  };

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold">Studio Settings</h1>
          <p className="text-muted-foreground">Customize your boutique branding and communication.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="font-headline">Boutique Details</CardTitle>
              <CardDescription>Manage how your shop appears on invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input id="shopName" defaultValue="ISRA Ethnics" />
               </div>
               <div className="space-y-2">
                  <Label htmlFor="address">Location Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea id="address" className="pl-10" defaultValue="Thekkummuri, Tirur, Kerala" />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ph1">Phone 1</Label>
                    <Input id="ph1" defaultValue="8113081120" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ph2">Phone 2</Label>
                    <Input id="ph2" defaultValue="9961264495" />
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="font-headline">Communication</CardTitle>
              <CardDescription>WhatsApp and social media settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="insta">Instagram Handle</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="insta" className="pl-10" defaultValue="@isra.ethnic" />
                  </div>
               </div>
               <div className="space-y-2">
                  <Label htmlFor="thankyou">Default Thank You Note</Label>
                  <Textarea 
                    id="thankyou" 
                    rows={4} 
                    defaultValue="Dear Customer, Thank you for shopping with ISRA Ethnics. Your invoice is attached. Happy Shopping! insta id @isra.ethnic" 
                  />
               </div>
               <div className="p-4 bg-secondary/5 rounded-lg flex gap-3 text-secondary">
                  <Info className="h-5 w-5 shrink-0" />
                  <p className="text-xs leading-relaxed">This message will be sent automatically to customers via WhatsApp after invoice generation.</p>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" className="bg-primary px-12 shadow-xl">
            <Save className="mr-2 h-4 w-4" /> Save All Changes
          </Button>
        </div>
      </div>
    </Shell>
  );
}
