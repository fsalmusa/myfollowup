import React from 'react';
import Modal from './Modal.jsx';
import { FollowUpBadge } from './StatusBadge.jsx';
import WhatsAppButton from './WhatsAppButton.jsx';
import FollowUpButton from './FollowUpButton.jsx';
import RenewButton from './RenewButton.jsx';
import FollowUpHistory from './FollowUpHistory.jsx';
import { isoToDisplay, formatDateTime } from '../lib/format.js';

function Item({ label, value }) {
  return (
    <div className="detail-item">
      <div className="di-label">{label}</div>
      <div className="di-value">{value || '—'}</div>
    </div>
  );
}

export default function CustomerDetailPanel({ customer, onToggle, onClose }) {
  if (!customer) return null;

  return (
    <Modal title="Detail Pelanggan" onClose={onClose} wide>
      <div className="detail-grid">
        <Item label="Nama" value={customer.name} />
        <Item label="No WhatsApp" value={customer.phone_display || customer.phone} />
        <Item label="Email Subscribe" value={customer.email_subscribe} />
        <Item label="Email Family" value={customer.email_family} />
        <Item label="Tarikh Subscribe" value={isoToDisplay(customer.subscribe_date)} />
        <Item label="Tarikh Expired" value={isoToDisplay(customer.expiry_date)} />
        <Item label="Group" value={customer.group_name} />
        <Item
          label="Last Follow Up"
          value={customer.last_follow_up_at ? formatDateTime(customer.last_follow_up_at) : '—'}
        />
      </div>

      <div style={{ margin: '18px 0' }}>
        <span className="di-label" style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
          Follow Up Status
        </span>
        <FollowUpBadge status={customer.follow_up_status} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        <button className="btn btn-whatsapp" onClick={() => window.open(customer.whatsapp_link, '_blank')}>
          💬 WhatsApp
        </button>
        <FollowUpButton customer={customer} onToggle={onToggle} />
        <RenewButton customer={customer} onRenewed={onToggle} />
      </div>

      <h4 style={{ marginBottom: 12, fontSize: 15 }}>📜 Sejarah Follow Up</h4>
      <FollowUpHistory customerId={customer.id} />
    </Modal>
  );
}
