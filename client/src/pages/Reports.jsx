import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import StatsCard from '../components/StatsCard.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Reports() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [groups, setGroups] = useState([]);
  const [subs, setSubs] = useState({ ACTIVE: 0, EXPIRING_SOON: 0, EXPIRED: 0 });

  const load = useCallback(async () => {
    try {
      const [s, g, cust] = await Promise.all([
        api.stats(),
        api.listGroups(),
        api.listCustomers({ limit: 200 }),
      ]);
      setStats(s);
      setGroups(g);
      const subCount = { ACTIVE: 0, EXPIRING_SOON: 0, EXPIRED: 0 };
      cust.data.forEach((c) => {
        if (subCount[c.subscription_status] !== undefined) subCount[c.subscription_status]++;
      });
      setSubs(subCount);
    } catch (e) {
      toast.error(e.message);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const completionRate = stats && stats.total_customers > 0
    ? Math.round((stats.followed_up / stats.total_customers) * 100)
    : 0;

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Laporan</h1>
          <div className="sub">Analisa prestasi follow-up</div>
        </div>
      </div>

      <div className="content">
        <div className="stats-grid">
          <StatsCard label="Jumlah Group" value={stats ? stats.total_groups : '—'} tone="blue" />
          <StatsCard label="Jumlah Customer" value={stats ? stats.total_customers : '—'} tone="purple" />
          <StatsCard label="Dah Follow Up" value={stats ? stats.followed_up : '—'} tone="green" />
          <StatsCard label="Belum Follow Up" value={stats ? stats.not_followed_up : '—'} tone="red" />
        </div>

        {/* Completion rate */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: 15 }}>Kadar Follow Up Selesai</h3>
            <strong>{completionRate}%</strong>
          </div>
          <div style={{ height: 12, background: '#eef1f7', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completionRate}%`, background: 'linear-gradient(90deg,#22c55e,#16a34a)', borderRadius: 999, transition: 'width 0.4s' }} />
          </div>
        </div>

        {/* Subscription breakdown */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Status Langganan</h3>
          <div className="sub-status-grid">
            <div className="sub-status-card">
              <div className="sub-status-icon active">🟢</div>
              <div className="sub-status-value">{subs.ACTIVE}</div>
              <div className="sub-status-label">Masih Aktif</div>
            </div>
            <div className="sub-status-card">
              <div className="sub-status-icon soon">🟠</div>
              <div className="sub-status-value">{subs.EXPIRING_SOON}</div>
              <div className="sub-status-label">Akan Expired</div>
            </div>
            <div className="sub-status-card">
              <div className="sub-status-icon expired">🔴</div>
              <div className="sub-status-value">{subs.EXPIRED}</div>
              <div className="sub-status-label">Expired</div>
            </div>
          </div>
        </div>

        {/* Per-group breakdown */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Pecahan Mengikut Group</h3>
          {groups.length === 0 ? (
            <p className="cell-muted">Belum ada group.</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Customer</th>
                    <th>Dah Follow Up</th>
                    <th>Belum Follow Up</th>
                    <th>Status</th>
                    <th style={{ width: 220 }}>Kemajuan</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => {
                    const pct = g.total_customers > 0 ? Math.round((g.completed / g.total_customers) * 100) : 0;
                    return (
                      <tr key={g.id}>
                        <td className="cell-name">{g.name}</td>
                        <td>{g.total_customers}</td>
                        <td style={{ color: 'var(--green)', fontWeight: 600 }}>{g.completed}</td>
                        <td style={{ color: 'var(--red)', fontWeight: 600 }}>{g.pending}</td>
                        <td>
                          {g.color === 'green' && <span className="status-pill green">✓ SELESAI</span>}
                          {g.color === 'red' && <span className="status-pill red">⏳ BELUM SELESAI</span>}
                          {g.color === 'neutral' && <span className="status-pill neutral">— KOSONG</span>}
                        </td>
                        <td>
                          <div style={{ height: 9, background: '#eef1f7', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: g.color === 'green' ? 'var(--green)' : 'var(--orange)', borderRadius: 999 }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
