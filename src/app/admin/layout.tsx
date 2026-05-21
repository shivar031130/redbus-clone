'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, ShieldCheck, CalendarCheck, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Operators', href: '/admin/operators', icon: ShieldCheck },
  { name: 'Bookings', href: '/admin/bookings', icon: CalendarCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, clearUser } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (user && role !== 'admin') {
      router.push('/');
    }
  }, [user, role, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearUser();
    router.push('/');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-50 min-h-screen">

      {/* Mobile Top Tab Bar */}
      <div className="md:hidden bg-[#0A2540] border-b overflow-x-auto text-white">
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
                  isActive ? 'bg-white/20 text-white' : 'text-slate-300 hover:bg-white/10'
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
      <aside className="hidden md:flex w-64 flex-col bg-[#0A2540] text-white shadow-xl z-10 relative shrink-0">
        {/* Admin Profile */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm">System Admin</h3>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@bussphere.com'}</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
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
                    ? 'bg-white/15 text-white shadow-inner border border-white/10'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10 gap-3 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
