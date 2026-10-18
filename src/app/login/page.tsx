"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="grid min-h-screen place-items-center bg-background p-4" role="status" aria-label="Loading sign in">
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-8 shadow-xl">
          <Skeleton className="mx-auto h-20 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-3 py-5 sm:px-6 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 -top-32 h-80 w-80 rounded-full border border-accent/30" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full border border-accent/20" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full border border-secondary/20" />

      <Card className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl sm:rounded-3xl md:grid-cols-2">
        <section className="relative flex min-h-0 flex-col justify-between overflow-hidden bg-[#1d0713] p-5 text-primary-foreground sm:p-8 md:min-h-[560px] md:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-primary-foreground/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-primary-foreground/10" />
          <div className="relative">
            <img src="/isra-logo-original.png" alt="ISRA Churidar & Sarees" className="block h-auto w-full max-w-[15rem] sm:max-w-[18rem] md:max-w-[20rem]" />
            <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/70 sm:mt-6 sm:text-xs sm:tracking-[0.24em] md:mt-8">
              <span className="h-px w-6 bg-[#e7bb58] sm:w-8" /> Boutique management
            </div>
          </div>

          <div className="relative mt-7 hidden md:block">
            <Sparkles className="mb-4 h-5 w-5 text-[#e7bb58]" />
            <h1 className="max-w-sm font-headline text-3xl leading-tight text-primary-foreground md:text-4xl">
              A considered space for your business.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-primary-foreground/70">
              Keep billing, inventory, and customer records together, ready for the day ahead.
            </p>
          </div>

          <p className="relative mt-10 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/50 md:block">
            ISRA ETHNICS <span className="mx-2 text-accent">•</span> TIRUR
          </p>
        </section>

        <section className="flex items-center p-5 sm:p-10 md:p-12">
          <div className="w-full max-w-md">
            <CardHeader className="mb-5 space-y-1.5 p-0 sm:mb-8 sm:space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Welcome</p>
              <CardTitle className="font-headline text-2xl sm:text-4xl">Sign in to continue</CardTitle>
              <p className="text-sm text-muted-foreground">Access your boutique workspace securely.</p>
            </CardHeader>
            <CardContent className="space-y-4 p-0 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" autoComplete="email" className="h-11 pl-10 sm:h-12" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" autoComplete="current-password" className="h-11 pl-10 sm:h-12" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
                </div>
              </div>
              <div className="grid gap-2.5 pt-1 sm:gap-3 sm:pt-2">
                <Button className="h-11 w-full shadow-md sm:h-12" onClick={() => handleAuth('signIn')} disabled={isSubmitting}>
                  {isSubmitting ? 'Please wait…' : 'Sign In'}
                </Button>
                <Button variant="outline" className="h-11 w-full bg-transparent sm:h-12" onClick={() => handleAuth('signUp')} disabled={isSubmitting}>
                  Create Account
                </Button>
              </div>
              <p className="hidden border-t border-border pt-5 text-center text-xs leading-5 text-muted-foreground sm:block">
                Your store workspace, thoughtfully organized.
              </p>
            </CardContent>
          </div>
        </section>
      </Card>
    </div>
  );
}
