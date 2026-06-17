'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase, onAuthStateChange } from '@/lib/auth';
import { isManager } from '@/lib/roles';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // If on login page, don't require authentication
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    // Check if user is authenticated and is a manager
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login if not authenticated
        router.push('/admin/login');
        return;
      }

      try {
        // Check if user is a manager
        const managerStatus = await isManager(session.user.id);
        
        if (!managerStatus) {
          // Not a manager - redirect to home
          router.push('/');
          return;
        }
      } catch (err) {
        // If role check fails (table doesn't exist yet), log and continue
        // The login page will assign the role on next login
        console.warn('⚠️ Role check failed:', err);
      }
      
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          router.push('/admin/login');
        } else {
          try {
            const managerStatus = await isManager(session.user.id);
            if (!managerStatus) {
              router.push('/');
            } else {
              setUser(session.user);
            }
          } catch (err) {
            console.warn('⚠️ Role check failed:', err);
            setUser(session.user);
          }
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };
  
  const navItems = [
    {
      href: "/admin",
      icon: "📊",
      label: "Dashboard",
    },
    {
      href: "/admin/rooms",
      icon: "🛏️",
      label: "Room Management",
    },
      
    {
      href: "/admin/bookings",
      icon: "📅",
      label: "Booking Manager",
    },

    {
      href: "/admin/hotel",
      icon: "🏨",
      label: "Hotel Info",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">Verifying access...</p>
        </div>
      </div>
    );
  }

  // For login page, render without layout
  if (isLoginPage) {
    return children;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-forest-900 text-white transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-6">
          <h1 className={`font-display text-xl font-bold ${!sidebarOpen && 'hidden'}`}>
            Larami Manager
          </h1>
        </div>
              
        <nav className="mt-8 px-3 flex-1">
          <div className="space-y-2">
            {navItems.map((item) => {
              const active =
              pathname === item.href || 
              (item.href !== "/admin" &&
                pathname.startsWith(item.href));

              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3
                    p-3 rounded-lg
                    transition-all duration-200
                    ${
                      active
                      ? "bg-gold-500 text-white"
                      : "hover:bg-forest-800"
                    }
                  `}
                >
                  <span className="text-xl">
                    {item.icon}
                  </span>
                  {sidebarOpen && (
                    <span>{item.label}</span>
                  )}
                </Link> 
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-forest-800 ">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 transition-all duration-200"
          >
            <span className="text-xl">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-2xl cursor-pointer hover:text-gold-500"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16MA 12h16MA 18h16"/>
            </svg>

          </button>
          <div className="text-sm text-gray-600">
            {user?.email}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
