import React from 'react';
import { SUBSCRIPTION_LABELS } from '../lib/format.js';

const CLASS = {
  ACTIVE: 'active',
  EXPIRING_SOON: 'expiring',
  EXPIRED: 'expired',
};

export function SubscriptionBadge({ status }) {
  const s = status || 'ACTIVE';
  return <span className={`badge ${CLASS[s] || 'gray'}`}>{SUBSCRIPTION_LABELS[s] || s}</span>;
}

export function FollowUpBadge({ status }) {
  const pending = status !== 'COMPLETED';
  return (
    <span className={`badge ${pending ? 'pending' : 'completed'}`}>
      {pending ? 'Belum Follow Up' : 'Dah Follow Up'}
    </span>
  );
}
