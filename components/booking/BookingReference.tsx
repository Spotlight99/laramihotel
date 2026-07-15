'use client';

import { useClipboard } from '@/hooks/useClipboard';

interface BookingReferenceProps {
  reference: string;
}

export default function BookingReference({ reference }: BookingReferenceProps) {
  const { copied, copyText } = useClipboard();

  return (
    <div className="rounded-2xl border border-forest-100 bg-forest-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest-500">Booking reference</p>
          <p className="mt-1 font-display text-xl font-semibold text-forest-900">{reference}</p>
        </div>
        <button
          type="button"
          onClick={() => void copyText(reference)}
          className="rounded-full border border-forest-200 bg-white px-4 py-2 text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          aria-label="Copy booking reference"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {copied && (
        <p className="mt-3 text-sm text-emerald-700" role="status" aria-live="polite">
          Booking reference copied.
        </p>
      )}
    </div>
  );
}
