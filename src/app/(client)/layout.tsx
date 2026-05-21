'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Ticket, Settings, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

const sidebarLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Bookings', href: '/history', icon: Ticket },
  { name: 'Profile Settings', href: '/settings', icon: Settings },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, clearUser } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (user && role !== 'client') {
      router.push('/');
    }
  }, [user, role, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearUser();
    router.push('/');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-secondary/20 min-h-screen">

      {/* Mobile Tab Bar */}
      <div className="md:hidden bg-white border-b overflow-x-auto">
        <div className="flex p-2 gap-2 min-w-max">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r shrink-0">
        <div className="p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{user?.email?.split('@')[0] || 'Passenger'}</h3>
              <p className="text-xs text-muted-foreground truncate">{user?.email || 'Guest'}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-50 gap-3 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
