import React, { useState } from 'react';

export default function GroupForm({ initial, onSubmit, onCancel, submitting }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama Group diperlukan.');
      return;
    }
    setError('');
    onSubmit({ name: name.trim(), description: description.trim() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>
          Nama Group <span className="req">*</span>
        </label>
        <input
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="cth: Ahmad"
          autoFocus
        />
        {error && <div className="form-error">{error}</div>}
      </div>

      <div className="form-group">
        <label>Description / Nota</label>
        <textarea
          className="form-control"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="cth: Customer dari iklan Facebook"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Menyimpan...' : 'Simpan Group'}
        </button>
      </div>
    </form>
  );
}
