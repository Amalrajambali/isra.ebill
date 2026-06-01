
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Users, History, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'New Invoice', icon: ShoppingCart, href: '/billing' },
  { label: 'Add Product', icon: Package, href: '/inventory' },
  { label: 'Customers', icon: '/customers', href: '/customers', lucide: Users },
  { label: 'History', icon: History, href: '/history' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between h-16 px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="p-6 text-left border-b">
                  <SheetTitle className="font-headline text-2xl">ISRA Ethnics</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-4">
                  {navItems.map((item) => {
                    const Icon = item.lucide || item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
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
              </SheetContent>
            </Sheet>
            <Link href="/" className="font-headline text-2xl font-bold text-primary">
              ISRA <span className="text-accent">Ethnics</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.lucide || item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? "default" : "ghost"}
                    className={cn(
                      "flex items-center gap-2",
                      pathname === item.href ? "" : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    {typeof Icon !== 'string' && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="container mx-auto max-w-7xl p-4 pb-24 animate-in fade-in duration-500 md:p-8 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Optional but good for mobile-first) */}
      <div className="md:hidden sticky bottom-0 z-40 overflow-x-auto border-t bg-white/95 backdrop-blur">
        <nav className="flex min-w-max justify-around gap-2 px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        {navItems.map((item) => {
          const Icon = item.lucide || item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex min-w-[76px] flex-col items-center rounded-lg px-2 py-2 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {typeof Icon !== 'string' && <Icon className={cn("h-6 w-6", isActive && "scale-110")} />}
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
        </nav>
      </div>
    </div>
  );
}
