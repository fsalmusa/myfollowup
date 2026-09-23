import React from 'react';

const TONES = {
  blue:   { icon: '👥', label: 'blue' },
  green:  { icon: '✅', label: 'green' },
  red:    { icon: '⏳', label: 'red' },
  purple: { icon: '📌', label: 'purple' },
  orange: { icon: '🔥', label: 'orange' },
  teal:   { icon: '📊', label: 'teal' },
};

export default function StatsCard({ label, value, tone = 'blue' }) {
  const t = TONES[tone] || TONES.blue;
  return (
    <div className={`stat-card stat-${t.label}`}>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-ghost" aria-hidden="true">{t.icon}</div>
    </div>
  );
}
