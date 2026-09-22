import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/groups', label: 'Senarai Group', icon: '👥' },
  { to: '/customers', label: 'Senarai Customer', icon: '🧑‍🤝‍🧑' },
  { to: '/calendar', label: 'Kalender Follow Up', icon: '📅' },
  { to: '/reports', label: 'Laporan', icon: '📈' },
  { to: '/settings', label: 'Tetapan', icon: '⚙️' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="logo">🤝</span>
        <span>Follow-Up CRM</span>
      </div>

      <div className="nav-label">Menu Utama</div>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}

      <div className="foot">v1.0.0 · Pengurusan Follow-Up</div>
    </aside>
  );
}
