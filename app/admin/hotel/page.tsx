'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/admin-api';

interface HotelInfo {
  id?: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager_whatsapp: string;
}

export default function HotelInfo() {
  const [hotelInfo, setHotelInfo] = useState<HotelInfo>({
    name: '',
    address: '',
    phone: '',
    email: '',
    manager_whatsapp: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchHotelInfo();
  }, []);

  const fetchHotelInfo = async () => {
    try {
      const data = await adminAPI.getHotelInfo();
      // Handle both array response and direct object response
      const hotelData = Array.isArray(data) && data.length > 0 ? data[0] : data;
      setHotelInfo(hotelData);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching hotel info:', err);
      setError(err?.message || 'Failed to load hotel information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const data = await adminAPI.updateHotelInfo(hotelInfo);
      setHotelInfo(data);
      setSuccess(true);
      setError(null);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('❌ Error saving hotel info:', err);
      setError(err?.message || 'Failed to save hotel information');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-forest-900 mb-2">
          Hotel Information
        </h1>
        <p className="text-gray-600">
          Manage your hotel's contact details and general information
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-100 border border-green-400 rounded-lg">
          <p className="text-green-700">✓ Hotel information updated successfully</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">Loading hotel information...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 max-w-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-forest-900 mb-2">
                Hotel Name *
              </label>
              <input
                type="text"
                value={hotelInfo.name}
                onChange={(e) => setHotelInfo({ ...hotelInfo, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest-900 mb-2">
                Address *
              </label>
              <textarea
                value={hotelInfo.address}
                onChange={(e) => setHotelInfo({ ...hotelInfo, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none transition"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest-900 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={hotelInfo.phone}
                onChange={(e) => setHotelInfo({ ...hotelInfo, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest-900 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={hotelInfo.email}
                onChange={(e) => setHotelInfo({ ...hotelInfo, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest-900 mb-2">
                Manager WhatsApp (for payment links)
              </label>
              <input
                type="text"
                value={hotelInfo.manager_whatsapp}
                onChange={(e) => setHotelInfo({ ...hotelInfo, manager_whatsapp: e.target.value })}
                placeholder="e.g., +234 801 234 5678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                This WhatsApp number will be used for payment links in booking confirmations
              </p>
            </div>

            <div className="pt-6 border-t">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gold-500 hover:bg-gold-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl">
        <h3 className="font-semibold text-blue-900 mb-3">ℹ️ Important Information</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• These details are displayed on your website and booking confirmations</li>
          <li>• Make sure the WhatsApp number is correct for payment link generation</li>
          <li>• All fields marked with * are required</li>
          <li>• Changes are saved immediately</li>
        </ul>
      </div>
    </div>
  );
}
