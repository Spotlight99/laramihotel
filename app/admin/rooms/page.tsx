'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/admin-api';

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  status: string;
  amenities: string[] | string;
  description: string;
  image_url: string;
}

export default function RoomsManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'STANDARD',
    price_per_night: '',
    capacity: '2',
    amenities: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const formatErrorMessage = (err: any): string => {
    if (typeof err === 'string') {
      return err;
    }
    
    if (err instanceof Error) {
      return err.message;
    }

    // Handle Django REST Framework error format: {"field": ["error message"]}
    if (typeof err === 'object') {
      const errors: string[] = [];
      for (const [field, messages] of Object.entries(err)) {
        if (Array.isArray(messages)) {
          errors.push(`${field}: ${messages.join(', ')}`);
        } else if (typeof messages === 'string') {
          errors.push(`${field}: ${messages}`);
        }
      }
      if (errors.length > 0) {
        return errors.join(' • ');
      }
    }

    return 'An unexpected error occurred';
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await adminAPI.getRooms();
      setRooms(data.results || data);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching rooms:', err);
      setError(err?.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const roomData: any = {
        room_number: formData.room_number,
        room_type: formData.room_type,
        price_per_night: parseFloat(formData.price_per_night),
        capacity: parseInt(formData.capacity),
        amenities: formData.amenities.trim() || '',
        description: formData.description.trim() || '',
      };

      // Upload image if selected
      if (imageFile) {
        try {
          console.log('📤 Uploading image:', imageFile.name, `(${(imageFile.size / 1024).toFixed(2)}KB)`);
          const uploadData = await adminAPI.uploadImage(imageFile);
          
          if (!uploadData.url) {
            throw new Error('Upload succeeded but no URL returned');
          }
          
          console.log('✅ Image uploaded, URL:', uploadData.url);
          roomData.image_url = uploadData.url;
        } catch (uploadErr) {
          const uploadMsg = uploadErr instanceof Error ? uploadErr.message : 'Unknown error';
          console.error('❌ Image upload failed:', uploadMsg);
          throw new Error(`Image upload failed: ${uploadMsg}`);
        }
      } else {
        console.log('ℹ️ No image selected, using default fallback');
        // Don't include image_url if not provided - backend will use fallback
      }

      console.log('💾 Creating/updating room with data:', roomData);

      if (editingId) {
        await adminAPI.updateRoom(editingId, roomData);
        console.log('✅ Room updated successfully');
      } else {
        await adminAPI.createRoom(roomData);
        console.log('✅ Room created successfully');
      }
      
      // Refresh rooms and reset form
      await fetchRooms();
      resetForm();
      setError(null);
    } catch (err: any) {
      console.error('❌ Error saving room:', err);
      const friendlyError = formatErrorMessage(err?.message ? JSON.parse(err.message) : err);
      setError(`Failed to save room: ${friendlyError}`);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRoom = async (roomId: number) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await adminAPI.deleteRoom(roomId);
      
      await fetchRooms();
      setError(null);
    } catch (err: any) {
      console.error('❌ Error deleting room:', err);
      setError(err?.message || 'Failed to delete room');
    }
  };

  const editRoom = (room: Room) => {
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      price_per_night: room.price_per_night.toString(),
      capacity: room.capacity.toString(),
      amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : (room.amenities || ''),
      description: room.description,
    });
    setEditingId(room.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      room_number: '',
      room_type: 'STANDARD',
      price_per_night: '',
      capacity: '2',
      amenities: '',
      description: '',
    });
    setImageFile(null);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-forest-900 mb-2">
            Room Management
          </h1>
          <p className="text-gray-600">
            Create, edit, and manage hotel rooms
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition"
        >
          {showForm ? '✕ Close' : '+ Add New Room'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-bold text-forest-900 mb-6">
            {editingId ? 'Edit Room' : 'Create New Room'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-forest-900 mb-2">
                Room Number *
              </label>
              <input
                type="text"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                placeholder="e.g., 101, 102"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest-900 mb-2">
                Room Type *
              </label>
              <select
                value={formData.room_type}
                onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
              >
                <option value="STANDARD">Standard</option>
                <option value="DELUXE">Deluxe</option>
                <option value="EXECUTIVE">Executive</option>
                <option value="SUITE">Suite</option>
                <option value="STUDIO">Studio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest-900 mb-2">
                Price Per Night (₦) *
              </label>
              <input
                type="number"
                value={formData.price_per_night}
                onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                placeholder="25000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest-900 mb-2">
                Capacity (Guests) *
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-forest-900 mb-2">
                Amenities (comma separated)
              </label>
              <input
                type="text"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                placeholder="e.g., WiFi, AC, Smart TV, Work Desk"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-forest-900 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Room description..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-forest-900 mb-2">
                Room Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {imageFile && <p className="text-sm text-green-600 mt-1">✓ File selected</p>}
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                submitting 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : 'bg-gold-500 hover:bg-gold-600 text-white'
              }`}
            >
              {submitting ? (
                <>
                  <span className="inline-block animate-spin">⟳</span>
                  Saving...
                </>
              ) : (
                editingId ? 'Update Room' : 'Create Room'
              )}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={resetForm}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                submitting 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Rooms List */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">No rooms yet. Create your first room!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
              {room.image_url && (
                <img
                  src={room.image_url}
                  alt={room.room_number}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-forest-900">
                    Room {room.room_number}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    room.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {room.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{room.room_type}</p>
                <p className="text-lg font-bold text-gold-500 mb-2">
                  ₦{room.price_per_night.toLocaleString()}/night
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  👥 Capacity: {room.capacity} guests
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => editRoom(room)}
                    className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition"
                  >
                    ✎ Edit
                  </button>
                  <button
                    onClick={() => deleteRoom(room.id)}
                    className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
