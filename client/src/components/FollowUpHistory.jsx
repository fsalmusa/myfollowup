import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDateTime } from '../lib/format.js';
import { useToast } from './Toast.jsx';

const ACTION_LABEL = {
  FOLLOW_UP: 'Follow Up',
  UNFOLLOW_UP: 'Batal Follow Up',
  NOTE: 'Nota',
};

export default function FollowUpHistory({ customerId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = () => {
    api
      .getHistory(customerId)
      .then(setHistory)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [customerId]);

  const addNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await api.addHistoryNote(customerId, note.trim());
      setNote('');
      toast.success('Nota berjaya ditambah.');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          className="form-control"
          placeholder="Tambah nota follow-up..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNote()}
        />
        <button className="btn btn-primary" onClick={addNote} disabled={saving || !note.trim()}>
          Tambah
        </button>
      </div>

      {loading ? (
        <p className="cell-muted">Memuatkan history...</p>
      ) : history.length === 0 ? (
        <p className="cell-muted">Belum ada rekod follow-up.</p>
      ) : (
        <ul className="timeline">
          {history.map((h) => (
            <li key={h.id} className={`action-${h.action}`}>
              <div className="tl-time">{formatDateTime(h.created_at)}</div>
              <div className="tl-action">{ACTION_LABEL[h.action] || h.action}</div>
              {h.note && <div className="tl-note">{h.note}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
