import { useState, useEffect } from 'react';
import { roomsAPI } from '@/lib/api';

export interface HotelInfo {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager_whatsapp: string;
}

let cachedHotelInfo: HotelInfo | null = null;
let hotelInfoPromise: Promise<HotelInfo | null> | null = null;

export const useHotelInfo = () => {
  const [hotel, setHotel] = useState<HotelInfo | null>(cachedHotelInfo);
  const [loading, setLoading] = useState(!cachedHotelInfo);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedHotelInfo) {
      setHotel(cachedHotelInfo);
      setLoading(false);
      return;
    }

    // Create or reuse existing promise to avoid race conditions
    if (!hotelInfoPromise) {
      hotelInfoPromise = (async () => {
        try {
          setLoading(true);
          const data = await roomsAPI.getHotelInfo();
          cachedHotelInfo = data;
          setHotel(data);
          setError(null);
          return data;
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to load hotel information';
          setError(errorMessage);
          console.error('❌ Failed to fetch hotel info:', err);
          return null;
        } finally {
          setLoading(false);
        }
      })();
    } else {
      hotelInfoPromise.then((data) => {
        if (data) {
          setHotel(data);
        }
        setLoading(false);
      });
    }
  }, []);

  return { hotel, loading, error };
};

// Static function for non-hook usage
export const getHotelInfo = async (): Promise<HotelInfo | null> => {
  if (cachedHotelInfo) {
    return cachedHotelInfo;
  }

  if (hotelInfoPromise) {
    return hotelInfoPromise;
  }

  hotelInfoPromise = (async () => {
    try {
      const data = await roomsAPI.getHotelInfo();
      cachedHotelInfo = data;
      return data;
    } catch (err: any) {
      console.error('❌ Failed to fetch hotel info:', err);
      return null;
    }
  })();

  return hotelInfoPromise;
};
