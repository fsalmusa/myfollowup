import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { MONTHS_MS, isoToDisplay } from '../lib/format.js';
import { useToast } from '../components/Toast.jsx';
import EmptyState from '../components/EmptyState.jsx';

const DOW = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const ACTION_LABEL = { FOLLOW_UP: 'Follow Up', UNFOLLOW_UP: 'Batal Follow Up', NOTE: 'Nota' };

function monthStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Calendar() {
  const toast = useToast();
  const now = new Date();
  const [month, setMonth] = useState(monthStr(now));
  const [data, setData] = useState({ days: {}, month, entries: 0, customer_count: 0 });
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.calendar(month);
      setData(res);
    } catch (e) {
      toast.error(e.message);
    }
  }, [month, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const cells = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const out = [];
    for (let i = 0; i < startDow; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(d);
    return { y, m, cells: out };
  }, [month]);

  const navigate = (delta) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(monthStr(d));
    setSelected(null);
  };

  const dayISO = (d) => {
    if (d === null) return null;
    return `${cells.y}-${String(cells.m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const todayISOStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const monthLabel = `${MONTHS_MS[cells.m - 1]} ${cells.y}`;
  const selectedEntries = selected ? data.days[selected] || [] : [];

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Kalender Follow Up</h1>
          <div className="sub">Aktiviti follow-up mengikut tarikh</div>
        </div>
      </div>

      <div className="content">
        <div className="cal-nav">
          <button className="btn btn-outline" onClick={() => navigate(-1)}>‹</button>
          <h2>{monthLabel}</h2>
          <button className="btn btn-outline" onClick={() => navigate(1)}>›</button>
          <button className="btn btn-ghost" onClick={() => { setMonth(monthStr(now)); setSelected(null); }}>
            Hari Ini
          </button>
          <span className="cell-muted" style={{ marginLeft: 'auto', fontSize: 13 }}>
            {data.entries} aktiviti · {data.customer_count} customer
          </span>
        </div>

        {data.entries === 0 ? (
          <div className="card">
            <EmptyState
              icon="📅"
              title="Tiada aktiviti follow-up bulan ini."
              description="Follow-up yang direkodkan akan muncul di sini."
            />
          </div>
        ) : (
          <>
            <div className="cal-grid">
              {DOW.map((d) => (
                <div key={d} className="cal-dow">{d}</div>
              ))}
              {cells.cells.map((d, i) => {
                const iso = dayISO(d);
                const entries = d !== null ? data.days[iso] || [] : [];
                const isToday = iso === todayISOStr;
                const isSelected = iso === selected;
                return (
                  <div
                    key={i}
                    className={`cal-day ${d === null ? 'out' : ''} ${isToday ? 'today' : ''}`}
                    style={isSelected ? { borderColor: 'var(--primary)', background: '#eff6ff' } : {}}
                    onClick={() => d !== null && setSelected(iso)}
                  >
                    {d !== null && (
                      <>
                        <span className="cd-num">{d}</span>
                        {entries.length > 0 && (
                          <>
                            <span className="cd-dot" />
                            <div className="cd-count">{entries.length} aktiviti</div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {selected && (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ marginBottom: 14 }}>
                  {isoToDisplay(selected)} · {selectedEntries.length} aktiviti
                </h3>
                {selectedEntries.length === 0 ? (
                  <p className="cell-muted">Tiada aktiviti pada tarikh ini.</p>
                ) : (
                  <ul className="timeline">
                    {selectedEntries.map((e) => (
                      <li key={e.id} className={`action-${e.action}`}>
                        <div className="tl-time">{e.time}</div>
                        <div className="tl-action">
                          🟢 {e.customer_name}
                          <span className="cell-sub"> · {ACTION_LABEL[e.action]}</span>
                        </div>
                        <div className="tl-note">{e.group_name}{e.note ? ` — ${e.note}` : ''}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
