'use client';
import { CreditCard, QrCode } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
export function PaymentMethodPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: 'va' | 'qris';
  onChange: (value: 'va' | 'qris') => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="payment-methods">
      {(['va', 'qris'] as const).map((method) => (
        <label key={method} className={value === method ? 'selected' : ''}>
          <input
            type="radio"
            name="checkout-payment"
            value={method}
            checked={value === method}
            onChange={() => onChange(method)}
            disabled={disabled}
          />
          {method === 'va' ? <CreditCard size={21} /> : <QrCode size={21} />}{' '}
          {t(method === 'va' ? 'Virtual Account demo' : 'QRIS demo')}
        </label>
      ))}
    </div>
  );
}
