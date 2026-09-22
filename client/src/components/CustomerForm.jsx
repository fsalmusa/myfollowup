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
            onChange={set('subscribe_date')}
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
      <div className="form-hint">Format tarikh: DD/MM/YYYY (cth: 22/09/2026)</div>

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
