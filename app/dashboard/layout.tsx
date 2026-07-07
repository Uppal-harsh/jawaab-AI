'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase-client';
import { 
  LayoutDashboard, 
  Store, 
  PhoneCall, 
  Settings, 
  LogOut
} from 'lucide-react';
import { cn } from '../../components/ui/Button';
import { BrandLogo } from '../../components/ui/BrandLogo';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Business Profile', href: '/dashboard/businesses', icon: <Store className="w-4 h-4" /> },
  { label: 'Call Logs', href: '/dashboard/calls', icon: <PhoneCall className="w-4 h-4" /> },
  { label: 'Settings', href: '/dashboard/settings', icon: <Settings className="w-4 h-4" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    async function checkPreferences() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: pref } = await supabase
          .from('onboarding_preferences')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!pref) {
          router.push('/onboarding');
        }
      } else {
        router.push('/login');
      }
    }
    checkPreferences();
  }, [router]);

  return (
    <div className="flex h-screen bg-background overflow-hidden text-primary">
      {/* Always Visible Sidebar: w-16 on mobile, w-64 on desktop */}
      <aside className="w-16 md:w-64 border-r border-border bg-surface flex flex-col transition-all duration-200 shrink-0">
        <div className="h-16 flex items-center justify-center md:justify-start px-4 md:px-6 border-b border-border">
          {/* Logo representation */}
          <div className="md:hidden flex items-center justify-center py-1">
            <img src="/icon.png" alt="Jawaab AI Icon" className="w-8 h-8 object-contain" />
          </div>
          <div className="hidden md:block">
            <BrandLogo size="sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-2 md:px-4 flex flex-col gap-1">
          <div className="text-[10px] md:text-xs font-semibold text-secondary uppercase tracking-wider mb-2 px-2 text-center md:text-left">
            <span className="hidden md:inline">Menu</span>
            <span className="md:hidden">•</span>
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 md:py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-accent/10 text-accent" 
                    : "text-secondary hover:text-primary hover:bg-white/5"
                )}
                title={item.label}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-2 md:p-4 border-t border-border">
          <button 
            onClick={async () => {
              try {
                await supabase.auth.signOut();
                await fetch('/api/auth', { method: 'DELETE' });
              } catch (e) {
                console.error('Logout failed:', e);
              }
              document.cookie = "jawaab_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
              router.push('/');
            }}
            className="flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 md:py-2 rounded-md text-sm font-medium text-secondary hover:text-white hover:bg-red-500/10 transition-colors w-full"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-10">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
