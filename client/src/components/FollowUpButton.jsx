import React, { useState } from 'react';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function FollowUpButton({ customer, onToggle }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const completed = customer.follow_up_status === 'COMPLETED';

  const handleClick = async () => {
    if (completed) {
      setConfirmOpen(true);
      return;
    }
    await onToggle('COMPLETED');
  };

  const handleConfirmUndo = async () => {
    setLoading(true);
    await onToggle('PENDING');
    setLoading(false);
    setConfirmOpen(false);
  };

  return (
    <>
      <button className={`fu-btn ${completed ? 'completed' : 'pending'}`} onClick={handleClick}>
        {completed ? '✓ Dah Follow Up' : '✕ Belum Follow Up'}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Tukar Status"
        message="Adakah anda mahu tukar status customer ini kepada Belum Follow Up?"
        confirmLabel="Ya, Tukar"
        onConfirm={handleConfirmUndo}
        onCancel={() => setConfirmOpen(false)}
        loading={loading}
      />
    </>
  );
}
