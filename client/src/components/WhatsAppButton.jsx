import React from 'react';
import { useToast } from './Toast.jsx';
import { contactLink, contactType } from '../lib/format.js';

const TYPE_META = {
  WhatsApp: { icon: '💬', label: 'WhatsApp' },
  Telegram: { icon: '✈️', label: 'Telegram' },
  Instagram: { icon: '📸', label: 'Instagram' },
};

export default function WhatsAppButton({ phone, name, compact = true }) {
  const toast = useToast();
  const type = contactType(phone);
  const link = contactLink(phone);
  const meta = TYPE_META[type] || { icon: '💬', label: 'Contact' };

  const handleClick = () => {
    if (!link) {
      toast.error('Tiada nombor / username diisi.');
      return;
    }
    window.open(link, '_blank', 'noopener');
  };

  return (
    <button
      className="wa-btn"
      onClick={handleClick}
      disabled={!link}
      title={link ? `${meta.label}: ${phone}` : 'Tiada nombor / username'}
    >
      <span>{meta.icon}</span>
      {!compact && <span>{meta.label}</span>}
    </button>
  );
}
