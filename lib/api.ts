// API Configuration - CRITICAL for frontend-backend communication
// This must match your deployed backend URL

// Environment hierarchy:
// 1. process.env.NEXT_PUBLIC_API_URL (set by Vercel or .env file)
// 2. Fallback to development default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Validate API URL configuration on client startup
if (typeof window !== 'undefined') {
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalhost = API_BASE_URL.includes('localhost');
  
  // Warn if using localhost in production
  if (isProduction && isLocalhost) {
    console.warn('Using localhost in production. Set NEXT_PUBLIC_API_URL in Vercel Environment Variables.');
  }
}

/**
 * Custom error class for API validation errors
 * Stores the full error response data for structured error handling
 */
export class APIValidationError extends Error {
  constructor(
    public statusCode: number,
    public data: any
  ) {
    super('API Validation Error');
    this.name = 'APIValidationError';
  }
}

// Helper function to safely make API requests with error context
const makeRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = null;
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.error || errorMessage;
      } catch {
        // errorText is not JSON, use as is
        if (errorText) errorMessage = errorText;
      }
      
      console.warn(`API Error: ${url}`, {
        status: response.status,
        message: errorMessage,
        data: errorData,
      });
      
      // Throw a validation error with the full response data
      throw new APIValidationError(response.status, errorData || { detail: errorMessage });
    }
    
    return response;
  } catch (error: any) {
    console.warn(`Request failed: ${url}`, {
      error: error?.message,
      url,
    });
    throw error;
  }
};


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
    const url = `${API_BASE_URL}/rooms/available/?${params}`;
    const res = await makeRequest(url);
    const data = await res.json();
    
    // Handle both array and paginated responses
    const rooms = Array.isArray(data) ? data : (data?.results || []);
    return rooms;
  },

  checkRoomAvailability: async (roomId: number, checkIn: string, checkOut: string) => {
    const rooms = await roomsAPI.getAvailable(checkIn, checkOut);
    return rooms.some((room: any) => String(room.id) === String(roomId));
  },

  getAll: async () => {
    const url = `${API_BASE_URL}/rooms/?t=${Date.now()}`;
    const res = await makeRequest(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await res.json();
    // Determine what we got and extract the array
    let result: any[] = [];
    
    if (Array.isArray(data)) {
      result = data;
    } else if (data?.results && Array.isArray(data.results)) {
      result = data.results;
    } else {
      console.warn('Unexpected response format from API:', data);
      throw new Error('Invalid response format from /rooms/ endpoint');
    }
    
    return result;
  },

  getHotelInfo: async () => {
    const url = `${API_BASE_URL}/rooms/hotel_info/`;
    const res = await makeRequest(url);
    const data = await res.json();
    
    return data;
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

    const url = `${API_BASE_URL}/bookings/`;
    
    const res = await makeRequest(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(booking),
    });

    const data = await res.json();
    return data;
  },

  search: async (email: string, phone?: string) => {
    const params = new URLSearchParams({ email });
    if (phone) params.append('phone', phone);
    
    const url = `${API_BASE_URL}/bookings/search/?${params}`;
    console.log('📡 Searching bookings:', { url, email });
    
    const res = await makeRequest(url);
    const data = await res.json();
    
    console.log('✅ Bookings search completed:', { count: data?.length || 0 });
    return data;
  },

  getById: async (id: number, token?: string) => {
    const url = `${API_BASE_URL}/bookings/${id}/`;
    console.log('📡 Fetching booking:', { url, id });
    
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const res = await makeRequest(url, { headers });
    
    const data = await res.json();
    console.log('✅ Booking fetched:', { id: data?.id });
    return data;
  },

  confirmPayment: async (id: number, token: string) => {
    const url = `${API_BASE_URL}/bookings/${id}/confirm_payment/`;
    console.log('📡 Confirming payment:', { url, id });
    
    const res = await makeRequest(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await res.json();
    console.log('✅ Payment confirmed:', { id });
    return data;
  },

  checkIn: async (id: number, token: string) => {
    const url = `${API_BASE_URL}/bookings/${id}/check_in/`;
    console.log('📡 Checking in booking:', { url, id });
    
    const res = await makeRequest(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await res.json();
    console.log('✅ Check-in completed:', { id });
    return data;
  },

  checkOut: async (id: number, token: string) => {
    const url = `${API_BASE_URL}/bookings/${id}/check_out/`;
    console.log('📡 Checking out booking:', { url, id });
    
    const res = await makeRequest(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await res.json();
    console.log('✅ Check-out completed:', { id });
    return data;
  },

  cancel: async (id: number, token?: string) => {
    const url = `${API_BASE_URL}/bookings/${id}/cancel/`;
    console.log('📡 Cancelling booking:', { url, id });
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await makeRequest(url, {
      method: 'POST',
      headers,
    });
    
    const data = await res.json();
    console.log('✅ Booking cancelled:', { id });
    return data;
  },

  getPaymentLink: async (id: number, token?: string) => {
    const url = `${API_BASE_URL}/bookings/${id}/payment_link/`;
    console.log('📡 Fetching payment link:', { url, id });
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await makeRequest(url, { headers });
    const data = await res.json();
    console.log('✅ Payment link generated:', { id });
    return data;
  },

  getReceipt: async (id: number, token?: string) => {
    const url = `${API_BASE_URL}/bookings/${id}/receipt/`;
    console.log('📡 Fetching receipt:', { url, id });
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await makeRequest(url, { headers });
    const data = await res.json();
    console.log('✅ Receipt fetched:', { id });
    return data;
  },
};

// Auth API
export const authAPI = {
  signup: async (email: string, password: string, name: string, phone: string) => {
    const url = `${API_BASE_URL}/auth/signup/`;
    console.log('📡 Signing up user:', { url, email });
    
    const res = await makeRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, phone }),
    });
    
    const data = await res.json();
    console.log('✅ Signup successful:', { email });
    return data;
  },

  login: async (email: string, password: string) => {
    const url = `${API_BASE_URL}/auth/login/`;
    console.log('📡 Logging in user:', { url, email });
    
    const res = await makeRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    console.log('✅ Login successful:', { email });
    return data;
  },

  sendOtp: async (email: string) => {
    const url = `${API_BASE_URL}/auth/send_otp/`;
    console.log('📡 Sending OTP:', { url, email });
    
    const res = await makeRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    const data = await res.json();
    console.log('✅ OTP sent:', { email });
    return data;
  },

  verifyOtp: async (email: string, token: string) => {
    const url = `${API_BASE_URL}/auth/verify_otp/`;
    console.log('📡 Verifying OTP:', { url, email });
    
    const res = await makeRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    });
    
    const data = await res.json();
    console.log('✅ OTP verified:', { email });
    return data;
  },

  refreshToken: async (refreshToken: string) => {
    const url = `${API_BASE_URL}/auth/refresh_token/`;
    console.log('📡 Refreshing token:', { url });
    
    const res = await makeRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    const data = await res.json();
    console.log('✅ Token refreshed');
    return data;
  },
};
