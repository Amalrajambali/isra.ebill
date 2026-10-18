
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Users, History, Settings, Menu, LogOut, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'New Invoice', icon: ShoppingCart, href: '/billing' },
  { label: 'Add Product', icon: Package, href: '/inventory' },
  { label: 'Customers', icon: '/customers', href: '/customers', lucide: Users },
  { label: 'History', icon: History, href: '/history' },
  { label: 'Reports', icon: BarChart3, href: '/reports' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [loading, pathname, router, user]);

  if (loading || (!user && pathname !== '/login')) {
    return (
      <div className="min-h-screen bg-background" role="status" aria-label="Loading application">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-8">
          <Skeleton className="h-8 w-36" />
          <div className="hidden items-center gap-3 md:flex">
            {Array.from({ length: 7 }, (_, index) => <Skeleton key={index} className="h-9 w-20" />)}
          </div>
        </header>
        <main className="container mx-auto max-w-7xl space-y-8 p-4 md:p-8">
          <div className="space-y-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  const navigationIsPending = pendingPath !== null && pendingPath !== pathname;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between h-16 px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 flex flex-col h-full">
                <SheetHeader className="p-6 text-left border-b flex-none">
                  <SheetTitle className="font-headline text-2xl">ISRA Ethnics</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-4 flex-grow overflow-y-auto">
                  {navItems.map((item) => {
                    const Icon = item.lucide || item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          setOpen(false);
                          if (item.href !== pathname) setPendingPath(item.href);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors",
                          pathname === item.href 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted"
                        )}
                      >
                        {typeof Icon !== 'string' && <Icon className="h-5 w-5" />}
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
                <div className="p-4 border-t mt-auto flex-none">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="font-headline text-2xl font-bold text-primary">
              ISRA <span className="text-accent">Ethnics</span>
            </Link>
          </div>

          {/* Mobile Logout Button */}
          <div className="flex md:hidden items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={logout}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.lucide || item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => {
                  if (item.href !== pathname) setPendingPath(item.href);
                }}>
                  <Button
                    variant={pathname === item.href ? "default" : "ghost"}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 transition-all",
                      pathname === item.href ? "shadow-sm" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    {typeof Icon !== 'string' && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="container mx-auto max-w-7xl p-4 pb-24 md:p-8 md:pb-8" aria-busy={navigationIsPending}>
          {navigationIsPending ? (
            <div className="animate-in fade-in duration-150" role="status" aria-label="Loading page">
              <div className="mb-8 space-y-3">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
              </div>
              <div className="grid gap-8 lg:grid-cols-2">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </div>
            </div>
          ) : children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Optional but good for mobile-first) */}
      <div className="sticky bottom-0 z-40 overflow-x-auto border-t border-border/80 bg-background/95 backdrop-blur md:hidden">
        <nav className="flex min-w-max justify-around gap-2 px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        {navItems.map((item) => {
          const Icon = item.lucide || item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => {
              if (item.href !== pathname) setPendingPath(item.href);
            }} className={cn(
              "flex min-w-[76px] flex-col items-center rounded-lg px-2 py-2 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {typeof Icon !== 'string' && <Icon className={cn("h-6 w-6", isActive && "scale-110")} />}
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          className="flex min-w-[76px] flex-col items-center rounded-lg px-2 py-2 text-muted-foreground hover:text-destructive transition-colors"
          onClick={() => logout()}
        >
          <LogOut className="h-6 w-6" />
          <span className="text-[10px] mt-1 font-medium">Logout</span>
        </button>
        </nav>
      </div>
    </div>
  );
}
