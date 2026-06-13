// API configuration
// CRITICAL: NEXT_PUBLIC_API_URL must be set on Vercel
// Local: http://localhost:8000/api
// Production: https://laramihotel.onrender.com/api
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Debug log to verify the API URL is correct
if (typeof window !== 'undefined') {
  console.log('🔧 API_BASE_URL:', API_BASE_URL);
}


interface BookingRequest {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  room_id: number;
  check_in: string;
  check_out: string;
  number_of_guests: number;
  special_requests?: string;
}

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  price_per_night: number;
  status: string;
  capacity: number;
  amenities: string[];
  description: string;
  image_url: string;
}

interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  room: Room;
  check_in: string;
  check_out: string;
  number_of_guests: number;
  special_requests: string;
  status: string;
  total_price: number;
  number_of_nights: number;
  payment_status: string;
  created_at: string;
}

// Rooms API
export const roomsAPI = {
  getAvailable: async (checkIn: string, checkOut: string, roomType?: string) => {
    const params = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      ...(roomType && { room_type: roomType }),
    });
    const res = await fetch(`${API_BASE_URL}/rooms/available/?${params}`);
    if (!res.ok) throw new Error('Failed to fetch available rooms');
    return res.json();
  },

  getAll: async () => {
  try {
    console.log("📡 roomsAPI.getAll() called");
    console.log("   - API_BASE_URL:", API_BASE_URL);
    
    const url = `${API_BASE_URL}/rooms/?t=${Date.now()}`;
    console.log("   - Full URL:", url);
    
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log("   - Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("   - JSON parsed successfully");
    console.log("   - Data type:", typeof data);
    console.log("   - Is Array?:", Array.isArray(data));
    console.log("   - Has results?:", !!data?.results);
    console.log("   - Raw data:", data);

    // Determine what we got and extract the array
    let result: any[] = [];
    
    if (Array.isArray(data)) {
      result = data;
      console.log("✅ roomsAPI: Data is array, using directly");
    } else if (data?.results && Array.isArray(data.results)) {
      result = data.results;
      console.log("✅ roomsAPI: Extracted results array");
    } else {
      console.error("❌ roomsAPI: Unexpected data format", data);
      result = [];
    }
    
    console.log("✅ roomsAPI returning array with length:", result.length);
    return result;
    
  } catch (error: any) {
    console.error("❌ roomsAPI.getAll() error:", error?.message);
    throw error;
  }
},

  getHotelInfo: async () => {
    const res = await fetch(`${API_BASE_URL}/rooms/hotel_info/`);
    if (!res.ok) throw new Error('Failed to fetch hotel info');
    return res.json();
  },
};

// Bookings API
export const bookingsAPI = {
  create: async (booking: BookingRequest, token?: string) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/bookings/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(booking),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create booking');
    }
    return res.json();
  },

  search: async (email: string, phone?: string) => {
    const params = new URLSearchParams({ email });
    if (phone) params.append('phone', phone);
    
    const res = await fetch(`${API_BASE_URL}/bookings/search/?${params}`);
    if (!res.ok) throw new Error('Failed to search bookings');
    return res.json();
  },

  getById: async (id: number, token: string) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch booking');
    return res.json();
  },

  confirmPayment: async (id: number, token: string) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/confirm_payment/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to confirm payment');
    return res.json();
  },

  checkIn: async (id: number, token: string) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/check_in/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to check in');
    return res.json();
  },

  checkOut: async (id: number, token: string) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/check_out/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to check out');
    return res.json();
  },
};

// Auth API
export const authAPI = {
  signup: async (email: string, password: string, name: string, phone: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, phone }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Signup failed');
    }
    return res.json();
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error('Login failed');
    }
    return res.json();
  },

  sendOtp: async (email: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/send_otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Failed to send OTP');
    return res.json();
  },

  verifyOtp: async (email: string, token: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/verify_otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    });
    if (!res.ok) throw new Error('Invalid OTP');
    return res.json();
  },

  refreshToken: async (refreshToken: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/refresh_token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) throw new Error('Token refresh failed');
    return res.json();
  },
};
