'use client';

import { Suspense } from 'react';
import BookingContent from './BookingContent';

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-28 bg-cream">
          <div className="max-w-2xl mx-auto px-6 text-center">
            Loading booking...
          </div>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}