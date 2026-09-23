import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';
import { useToast } from './Toast.jsx';
import { isoToDisplay } from '../lib/format.js';

/** Add months to an ISO date string, returns ISO date string. */
function addMonthsToISO(iso, months) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    // fallback: start from today
    const d = new Date();
    const base = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return addMonthsToISO(base, months);
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(y, mo + months, day);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const DURATIONS = [
  { label: '+1 Bulan', months: 1 },
  { label: '+3 Bulan', months: 3 },
  { label: '+6 Bulan', months: 6 },
  { label: '+1 Tahun', months: 12 },
];

/**
 * RenewModal — controlled modal for renewing a subscription.
 * `customer` must be set. Renders nothing when `customer` is null.
 */
export function RenewModal({ customer, onClose, onRenewed }) {
  const toast = useToast();
  const [duration, setDuration] = useState(12);
  const [submitting, setSubmitting] = useState(false);

  if (!customer) return null;

  const currentExpiry = customer.expiry_date || '';
  const newExpiry = addMonthsToISO(currentExpiry, duration);
  const newSubDate = addMonthsToISO(customer.subscribe_date || '', duration);

  const handleRenew = async () => {
    setSubmitting(true);
    try {
      const updated = await api.renewCustomer(customer.id, {
        new_expiry_date: newExpiry,
        new_subscribe_date: newSubDate,
      });
      toast.success(`✅ ${customer.name} diperbaharui sehingga ${isoToDisplay(newExpiry)}`);
      onClose();
      if (onRenewed) onRenewed(updated);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Renew Langganan — ${customer.name}`} onClose={onClose}>
      <div className="renew-current">
        <span className="di-label">Tarikh expired semasa:</span>{' '}
        <strong>{isoToDisplay(currentExpiry) || '—'}</strong>
      </div>

      <div className="form-group" style={{ marginTop: 14 }}>
        <label>Tempoh renewal</label>
        <div className="renew-durations">
          {DURATIONS.map((d) => (
            <button
              key={d.months}
              type="button"
              className={`renew-dur-btn ${duration === d.months ? 'active' : ''}`}
              onClick={() => setDuration(d.months)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="renew-preview">
        <div className="renew-row">
          <span className="di-label">Tarikh expired baru</span>
          <strong className="renew-new">{isoToDisplay(newExpiry)}</strong>
        </div>
        <div className="renew-row">
          <span className="di-label">Tarikh subscribe baru</span>
          <span>{isoToDisplay(newSubDate)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Batal
        </button>
        <button type="button" className="btn btn-primary" onClick={handleRenew} disabled={submitting}>
          {submitting ? 'Menyimpan...' : '✅ Sahkan Renew'}
        </button>
      </div>
    </Modal>
  );
}

/** Standalone renew button (used in detail panel). */
export default function RenewButton({ customer, onRenewed }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-renew" onClick={() => setOpen(true)} title="Renew langganan">
        🔄 Renew
      </button>
      {open && (
        <RenewModal
          customer={customer}
          onClose={() => setOpen(false)}
          onRenewed={onRenewed}
        />
      )}
    </>
  );
}
