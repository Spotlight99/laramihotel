'use client';

import { formatCurrency } from '@/lib/bookingUtils';

interface PaymentInstructionsProps {
  amountDue: number;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  bookingReference?: string;
}

export default function PaymentInstructions({
  amountDue,
  bankName = 'First Bank',
  accountName = 'Larami Holiday Hotel',
  accountNumber = '2034567890',
  bookingReference,
}: PaymentInstructionsProps) {
  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">Payment instructions</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-forest-900">Secure payment</h3>
        </div>
        <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">
          Pending verification
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-forest-100 bg-forest-50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-500">Bank</p>
            <p className="mt-1 font-semibold text-forest-900">{bankName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-500">Account name</p>
            <p className="mt-1 font-semibold text-forest-900">{accountName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-500">Account number</p>
            <p className="mt-1 font-semibold text-forest-900">{accountNumber}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-500">Amount due</p>
            <p className="mt-1 font-semibold text-forest-900">{formatCurrency(amountDue)}</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-forest-600">
        After making payment, kindly send your payment receipt through WhatsApp for verification. Your reservation will be confirmed once the payment has been reviewed.
      </p>

      {bookingReference && (
        <p className="mt-3 text-sm text-forest-500">
          Please include your booking reference <span className="font-semibold text-forest-800">{bookingReference}</span> when you send your receipt.
        </p>
      )}
    </div>
  );
}
