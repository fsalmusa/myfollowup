import React, { useState } from 'react';
import { displayToISO, isoToDisplay } from '../lib/format.js';

export default function CustomerForm({ initial, groups, onCancel, onSubmit, submitting }) {
  const [form, setForm] = useState({
    group_id: initial?.group_id || groups[0]?.id || '',
    name: initial?.name || '',
    phone: initial?.phone || '',
    email_subscribe: initial?.email_subscribe || '',
    email_family: initial?.email_family || '',
    subscribe_date: initial?.subscribe_date ? isoToDisplay(initial.subscribe_date) : '',
    expiry_date: initial?.expiry_date ? isoToDisplay(initial.expiry_date) : '',
  });
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Auto-set tarikh expired = +1 bulan dari tarikh subscribe (boleh edit manual)
  const handleSubscribeChange = (e) => {
    const subDisplay = e.target.value;
    setForm((f) => {
      const subISO = displayToISO(subDisplay);
      let expDisplay = f.expiry_date;
      if (subISO) {
        const m = subISO.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        d.setMonth(d.getMonth() + 1);
        const p = (n) => String(n).padStart(2, '0');
        expDisplay = `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
      }
      return { ...f, subscribe_date: subDisplay, expiry_date: expDisplay };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Nama customer diperlukan.');
      return;
    }
    if (!form.group_id) {
      setError('Sila pilih group.');
      return;
    }
    const payload = {
      group_id: Number(form.group_id),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email_subscribe: form.email_subscribe.trim(),
      email_family: form.email_family.trim(),
      subscribe_date: displayToISO(form.subscribe_date),
      expiry_date: displayToISO(form.expiry_date),
    };
    setError('');
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>
          Nama <span className="req">*</span>
        </label>
        <input
          className="form-control"
          value={form.name}
          onChange={set('name')}
          placeholder="cth: Ahmad Zaki"
          autoFocus
        />
        {error && <div className="form-error">{error}</div>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>No WhatsApp</label>
          <input
            className="form-control"
            value={form.phone}
            onChange={set('phone')}
            placeholder="cth: 0123456789"
          />
        </div>
        <div className="form-group">
          <label>Group</label>
          <select className="form-control" value={form.group_id} onChange={set('group_id')}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Email Subscribe</label>
          <input
            className="form-control"
            value={form.email_subscribe}
            onChange={set('email_subscribe')}
            placeholder="cth: ahmad@gmail.com"
          />
        </div>
        <div className="form-group">
          <label>Email Family</label>
          <input
            className="form-control"
            value={form.email_family}
            onChange={set('email_family')}
            placeholder="cth: family@gmail.com"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Tarikh Subscribe</label>
          <input
            className="form-control"
            value={form.subscribe_date}
            onChange={handleSubscribeChange}
            placeholder="DD/MM/YYYY"
          />
        </div>
        <div className="form-group">
          <label>Tarikh Expired</label>
          <input
            className="form-control"
            value={form.expiry_date}
            onChange={set('expiry_date')}
            placeholder="DD/MM/YYYY"
          />
        </div>
      </div>
      <div className="form-hint">Format tarikh: DD/MM/YYYY — tarikh expired auto +1 bulan dari tarikh subscribe, boleh ubah manual.</div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Menyimpan...' : 'Simpan Customer'}
        </button>
      </div>
    </form>
  );
}
