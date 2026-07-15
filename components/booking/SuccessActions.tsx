'use client';

import Link from 'next/link';

interface SuccessActionsProps {
  onVerifyPayment: () => void;
  onDownloadReservation: () => void;
  onPrintReservation: () => void;
  isDownloading?: boolean;
}

export default function SuccessActions({
  onVerifyPayment,
  onDownloadReservation,
  onPrintReservation,
  isDownloading = false,
}: SuccessActionsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href="/"
        className="rounded-xl border border-forest-200 bg-white px-4 py-3 text-center text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
      >
        Back home
      </Link>
      <Link
        href="/#rooms"
        className="rounded-xl border border-forest-200 bg-white px-4 py-3 text-center text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
      >
        Browse more rooms
      </Link>
      <button
        type="button"
        onClick={onVerifyPayment}
        className="rounded-xl bg-gold-500 px-4 py-3 text-center text-sm font-semibold text-forest-900 transition-colors hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
      >
        Verify payment via WhatsApp
      </button>
      <button
        type="button"
        onClick={onDownloadReservation}
        disabled={isDownloading}
        className="rounded-xl border border-forest-200 bg-white px-4 py-3 text-center text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-50 focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDownloading ? 'Preparing PDF…' : 'Download reservation'}
      </button>
      <button
        type="button"
        onClick={onPrintReservation}
        className="rounded-xl border border-forest-200 bg-white px-4 py-3 text-center text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-50 focus:outline-none focus:ring-2 focus:ring-gold-500 sm:col-span-2"
      >
        Print reservation
      </button>
    </div>
  );
}
