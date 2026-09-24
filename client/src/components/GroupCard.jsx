import React from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown from './Dropdown.jsx';

export default function GroupCard({ group, onEdit, onDelete }) {
  const navigate = useNavigate();
  const theme = `theme-${group.color || 'neutral'}`;
  const isRed = group.color === 'red';
  const isGreen = group.color === 'green';
  const hasExpired = (group.expired_pending ?? 0) > 0;

  return (
    <div className={`group-card ${theme}${hasExpired ? ' has-expired' : ''}`}>
      <div className="gc-menu">
        <Dropdown
          items={[
            { icon: '✏️', label: 'Edit Group', onClick: () => onEdit(group) },
            { icon: '🗑️', label: 'Delete Group', danger: true, onClick: () => onDelete(group) },
          ]}
        />
      </div>

      <div className="gc-top">
        <h3>{group.name}</h3>
      </div>
      <div className="gc-desc">{group.description || '—'}</div>

      <div className="gc-count">
        {group.total_customers} <span>Customer</span>
      </div>

      <div className="gc-stats">
        <span className="ok">🟢 {group.completed} Dah Follow Up</span>
        <span className="no">🔴 {group.pending} Belum Follow Up</span>
        <span className="exp">⏰ {group.expired_pending ?? 0} Expired (Belum Follow Up)</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        {isGreen && <span className="status-pill green">✓ SELESAI</span>}
        {isRed && <span className="status-pill red">⏳ BELUM SELESAI</span>}
        {!isGreen && !isRed && <span className="status-pill neutral">— KOSONG</span>}
      </div>

      <div className="gc-actions">
        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/groups/${group.id}`)}>
          Buka Group
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => onEdit(group)}>
          Edit
        </button>
      </div>
    </div>
  );
}
