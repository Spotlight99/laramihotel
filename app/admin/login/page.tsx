'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithPassword } from '@/lib/auth';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { session } = await signInWithPassword(email, password);

      if (session) {
        // Redirect to admin dashboard
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-900 to-forest-800">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Larami Holiday
          </h1>
          <p className="text-gold-500 text-sm tracking-widest uppercase">
            Manager Portal
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-2xl p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-forest-900 mb-6">
              Manager Login
            </h2>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-forest-900 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@laramihotel.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-forest-900 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition duration-300"
          >
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </button>

          <div className="text-center text-sm text-gray-600">
            <p>
              Don't have an account?{' '}
              <Link href="/" className="text-gold-500 hover:underline">
                Return Home
              </Link>
            </p>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-forest-800 bg-opacity-50 backdrop-blur rounded-lg p-4 border border-forest-700">
          <p className="text-sm text-white">
            <span className="font-semibold">Manager Portal:</span> This is a secure area for hotel managers to manage rooms, bookings, and hotel information.
          </p>
        </div>
      </div>
    </div>
  );
}
