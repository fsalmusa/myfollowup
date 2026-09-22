import React from 'react';

const ICON_MAP = {
  blue: '👥',
  green: '✅',
  red: '⏳',
  purple: '📌',
};

export default function StatsCard({ label, value, tone = 'blue' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{ICON_MAP[tone] || ICON_MAP.blue}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
