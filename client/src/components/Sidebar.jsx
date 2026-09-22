import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/groups', label: 'Senarai Group', icon: '👥' },
  { to: '/customers', label: 'Senarai Customer', icon: '🧑‍🤝‍🧑' },
  { to: '/calendar', label: 'Kalender Follow Up', icon: '📅' },
  { to: '/reports', label: 'Laporan', icon: '📈' },
  { to: '/settings', label: 'Tetapan', icon: '⚙️' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Tutup drawer setiap kali route berubah
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll bila drawer terbuka
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* HAMBURGER (mobile topbar button) */}
      <button
        className="hamburger"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
      >
        <span></span><span></span><span></span>
      </button>

      {/* OVERLAY (mobile) */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="logo">🤝</span>
          <span>Follow-Up CRM</span>
        </div>

        <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Tutup menu">
          ✕
        </button>

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

      {/* BOTTOM NAV (mobile) */}
      <nav className="bottom-nav">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
