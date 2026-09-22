import React from 'react';
import { useToast } from './Toast.jsx';
import { whatsappLink } from '../lib/format.js';

export default function WhatsAppButton({ phone, name, compact = true }) {
  const toast = useToast();
  const link = whatsappLink(phone);

  const handleClick = () => {
    if (!link) {
      toast.error('No. WhatsApp belum diisi.');
      return;
    }
    window.open(link, '_blank', 'noopener');
  };

  return (
    <button className="wa-btn" onClick={handleClick} disabled={!link} title={link || 'Tiada nombor'}>
      <span>💬</span>
      {!compact && <span>WhatsApp</span>}
    </button>
  );
}
