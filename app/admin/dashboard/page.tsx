'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { user, accessToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || !accessToken) {
      router.push('/admin/login');
    }
  }, [user, accessToken, router]);

  if (!user || !accessToken) {
    return <div className="py-28 text-center">Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-forest-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-white text-4xl font-semibold mb-2">Admin Dashboard</h1>
          <p className="text-white/60">Manage bookings, check-ins, and hotel operations</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
            <p className="text-white/60 text-sm mb-2">Today's Check-ins</p>
            <p className="font-display text-white text-3xl font-semibold">-</p>
          </div>
          <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
            <p className="text-white/60 text-sm mb-2">Pending Payments</p>
            <p className="font-display text-white text-3xl font-semibold">-</p>
          </div>
          <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
            <p className="text-white/60 text-sm mb-2">Occupied Rooms</p>
            <p className="font-display text-white text-3xl font-semibold">-</p>
          </div>
          <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
            <p className="text-white/60 text-sm mb-2">Available Rooms</p>
            <p className="font-display text-white text-3xl font-semibold">-</p>
          </div>
        </div>

        {/* Main Content - Tabs */}
        <div className="bg-white/5 rounded-2xl border border-white/20 p-8">
          <div className="flex gap-6 mb-8 border-b border-white/10">
            <button className="font-display text-white pb-4 border-b-2 border-gold-400">
              Bookings
            </button>
            <button className="font-display text-white/60 pb-4">
              Check-in/Out
            </button>
            <button className="font-display text-white/60 pb-4">
              Housekeeping
            </button>
            <button className="font-display text-white/60 pb-4">
              Invoices
            </button>
          </div>

          <div className="text-center py-12">
            <p className="text-white/60">Dashboard features coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
