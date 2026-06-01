"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, router, user]);

  const handleAuth = async (mode: 'signIn' | 'signUp') => {
    if (!email.trim() || !password.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing details',
        description: 'Please enter email and password.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
      router.replace('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      toast({
        variant: 'destructive',
        title: mode === 'signIn' ? 'Sign in failed' : 'Sign up failed',
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">ISRA Ethnics Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="grid gap-2">
            <Button className="w-full" onClick={() => handleAuth('signIn')} disabled={isSubmitting}>
              Sign In
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleAuth('signUp')} disabled={isSubmitting}>
              Create Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
