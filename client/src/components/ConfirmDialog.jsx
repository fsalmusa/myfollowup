import React from 'react';
import Modal from './Modal.jsx';

export default function ConfirmDialog({
  open,
  title = 'Pengesahan',
  message,
  confirmLabel = 'Ya, Teruskan',
  cancelLabel = 'Batal',
  danger = true,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!open) return null;
  return (
    <Modal title={title} onClose={onCancel}>
      <p style={{ fontSize: '14.5px', lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <button className="btn btn-outline" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </button>
        <button
          className={`btn ${danger ? 'btn-red' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Memproses...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
