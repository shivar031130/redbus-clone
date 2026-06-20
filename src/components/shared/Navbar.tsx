'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { Bus, LogOut, Menu, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Navbar() {
  const router = useRouter();
  const { user, role, isLoading, clearUser } = useAuthStore();
  const supabase = createClient();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
        .then(({ data }) => setAvatarUrl(data?.avatar_url || null));
    } else {
      setAvatarUrl(null);
    }
  }, [user?.id, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearUser();
    router.push('/');
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary p-2 rounded-lg group-hover:bg-primary/90 transition-colors">
                <Bus className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">redBus</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Find Tickets
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="gap-2 rounded-full pl-2 pr-4 border hover:bg-muted flex items-center justify-center h-10 transition-colors cursor-pointer outline-none focus:outline-none">
                  <div className="h-7 w-7 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{role === 'admin' ? 'Admin' : role === 'operator' ? 'Operator' : 'My Account'}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {role === 'client' && (
                    <>
                      <DropdownMenuItem><Link href="/dashboard" className="w-full">Dashboard</Link></DropdownMenuItem>
                      <DropdownMenuItem><Link href="/history" className="w-full">My Bookings</Link></DropdownMenuItem>
                    </>
                  )}
                  {role === 'operator' && (
                    <>
                      <DropdownMenuItem><Link href="/operator/dashboard" className="w-full">Dashboard</Link></DropdownMenuItem>
                      <DropdownMenuItem><Link href="/operator/buses" className="w-full">Manage Buses</Link></DropdownMenuItem>
                      <DropdownMenuItem><Link href="/operator/settings" className="w-full flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</Link></DropdownMenuItem>
                    </>
                  )}
                  {role === 'admin' && (
                    <>
                      <DropdownMenuItem><Link href="/admin/dashboard" className="w-full">Admin Panel</Link></DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isLoading ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 rounded-full"
                >
                  Sign up
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
