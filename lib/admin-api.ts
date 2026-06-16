import { getAccessToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  skipContentType?: boolean;
}

export const makeAuthenticatedRequest = async (
  endpoint: string,
  options: FetchOptions = {}
) => {
  const { skipAuth = false, skipContentType = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {};

  // Add existing headers if they're a plain object
  if (fetchOptions.headers && typeof fetchOptions.headers === 'object' && !(fetchOptions.headers instanceof Headers)) {
    Object.assign(headers, fetchOptions.headers as Record<string, string>);
  }

  // Only set Content-Type if not skipped and not already set
  if (!skipContentType && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...fetchOptions,
    headers: headers as HeadersInit,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response;
};

export const adminAPI = {
  // Bookings
  getBookings: () => makeAuthenticatedRequest('/admin/bookings/'),
  getBookingStats: () => makeAuthenticatedRequest('/admin/bookings/statistics/'),
  confirmBooking: (id: number) =>
    makeAuthenticatedRequest(`/admin/bookings/${id}/confirm_booking/`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    }),
  checkoutGuest: (id: number) =>
    makeAuthenticatedRequest(`/admin/bookings/${id}/checkout_guest/`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    }),
  cancelBooking: (id: number) =>
    makeAuthenticatedRequest(`/admin/bookings/${id}/cancel_booking/`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    }),

  // Rooms
  getRooms: () => makeAuthenticatedRequest('/admin/rooms/'),
  createRoom: (data: any) =>
    makeAuthenticatedRequest('/admin/rooms/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRoom: (id: number, data: any) =>
    makeAuthenticatedRequest(`/admin/rooms/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteRoom: (id: number) =>
    makeAuthenticatedRequest(`/admin/rooms/${id}/`, {
      method: 'DELETE',
    }),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return makeAuthenticatedRequest('/admin/rooms/upload_image/', {
      method: 'POST',
      body: formData,
      skipContentType: true, // Let browser set Content-Type with boundary
    });
  },

  // Hotel Info
  getHotelInfo: () => makeAuthenticatedRequest('/admin/hotel/'),
  updateHotelInfo: (data: any) =>
    makeAuthenticatedRequest('/admin/hotel/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
