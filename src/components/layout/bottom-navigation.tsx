'use client';

import { User, FileText, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

// Renamed 'to' to 'href' to follow Next.js conventions
const navItems = [
  { href: '/dashboard', icon: User, label: 'Ark.Card' }, // Assuming main dashboard page is /dashboard
  { href: '/data', icon: FileText, label: 'My Data' },
  { href: '/wallet', icon: Wallet, label: 'Point' },
];

export const BottomNavigation = () => {
  const pathname = usePathname();

  return (
    <nav className='glass border-border safe-bottom fixed right-0 bottom-0 left-0 z-50 border-t py-2'>
      <div className='mx-auto flex h-16 max-w-lg items-center justify-around'>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 transition-all duration-200'
              )}
            >
              <div
                className={cn(
                  'rounded-xl p-2 transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className='h-5 w-5' />
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
