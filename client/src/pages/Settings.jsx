import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../components/Toast.jsx';

export default function Settings() {
  const toast = useToast();
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/health').then((r) => r.json());
      setHealth(res);
      toast.success('Server dalam keadaan baik.');
    } catch (e) {
      toast.error('Server tidak dapat dihubungi.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="cell-muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Tetapan</h1>
          <div className="sub">Konfigurasi sistem</div>
        </div>
      </div>

      <div className="content" style={{ maxWidth: 680 }}>
        <div className="card" style={{ padding: 22, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>🖥️ Status Server</h3>
          <Row label="Status API" value={health ? '✅ Online' : '⏳ Memeriksa...'} />
          <Row label="Masa Server" value={health ? new Date(health.time).toLocaleString('ms-MY') : '—'} />
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-outline" onClick={check} disabled={checking}>
              {checking ? 'Memeriksa...' : 'Semak Semula'}
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>ℹ️ Maklumat Aplikasi</h3>
          <Row label="Nama" value="Follow-Up CRM" />
          <Row label="Versi" value="1.0.0" />
          <Row label="Pangkalan Data" value="SQLite (node:sqlite)" />
          <Row label="Bahasa UI" value="Bahasa Melayu Malaysia" />
          <p className="cell-muted" style={{ marginTop: 14, fontSize: 13, lineHeight: 1.6 }}>
            🔐 Keselamatan: sistem ini tidak memerlukan login buat masa ini. Untuk menambah
            autentikasi admin, tetapkan pembolehubah persekitaran <code>ADMIN_TOKEN</code> pada
            server dan sambungkan middleware auth di <code>server/index.js</code>. Semua kredensial
            pangkalan data disimpan di sisi server sahaja.
          </p>
        </div>
      </div>
    </div>
  );
}
