import React from 'react';

export default function EmptyState({ icon = '📭', title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="es-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
