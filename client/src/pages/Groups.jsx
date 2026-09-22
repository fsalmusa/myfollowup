import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import SearchBar from '../components/SearchBar.jsx';
import Modal from '../components/Modal.jsx';
import GroupForm from '../components/GroupForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Dropdown from '../components/Dropdown.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Groups() {
  const navigate = useNavigate();
  const toast = useToast();
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGroups(await api.listGroups(search));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (g) => {
    setEditing(g);
    setFormOpen(true);
  };
  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) {
        await api.updateGroup(editing.id, payload);
        toast.success('Group berjaya dikemaskini.');
      } else {
        await api.createGroup(payload);
        toast.success('Group berjaya ditambah.');
      }
      setFormOpen(false);
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteGroup(deleteTarget.id);
      toast.success('Group berjaya dipadam.');
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const deleteMessage = deleteTarget
    ? deleteTarget.total_customers > 0
      ? `Group ini mempunyai ${deleteTarget.total_customers} customer. Semua customer dalam group ini akan turut dipadam.`
      : 'Adakah anda pasti mahu delete group ini?'
    : '';

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Senarai Group</h1>
          <div className="sub">Semua group beserta status follow-up</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Group</button>
      </div>

      <div className="content">
        <div className="toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Cari group..." />
        </div>

        {loading ? (
          <p className="cell-muted">Memuatkan...</p>
        ) : groups.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="👥"
              title="Belum ada group"
              description={search ? 'Tiada group dijumpai.' : 'Mulakan dengan menambah group pertama anda.'}
              actionLabel="+ Tambah Group"
              onAction={openAdd}
            />
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Group</th>
                    <th>Description</th>
                    <th>Customer</th>
                    <th>Dah Follow Up</th>
                    <th>Belum Follow Up</th>
                    <th>Status</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g, i) => (
                    <tr key={g.id}>
                      <td className="cell-muted">{i + 1}</td>
                      <td className="cell-name" style={{ textTransform: 'uppercase' }}>{g.name}</td>
                      <td className="cell-muted">{g.description || '—'}</td>
                      <td>{g.total_customers}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 600 }}>{g.completed}</td>
                      <td style={{ color: 'var(--red)', fontWeight: 600 }}>{g.pending}</td>
                      <td>
                        {g.color === 'green' && <span className="status-pill green">✓ SELESAI</span>}
                        {g.color === 'red' && <span className="status-pill red">⏳ BELUM SELESAI</span>}
                        {g.color === 'neutral' && <span className="status-pill neutral">— KOSONG</span>}
                      </td>
                      <td>
                        <Dropdown
                          items={[
                            { icon: '📂', label: 'Buka Group', onClick: () => navigate(`/groups/${g.id}`) },
                            { icon: '✏️', label: 'Edit Group', onClick: () => openEdit(g) },
                            { icon: '🗑️', label: 'Delete Group', danger: true, onClick: () => setDeleteTarget(g) },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <Modal title={editing ? 'Edit Group' : 'Tambah Group'} onClose={() => setFormOpen(false)}>
          <GroupForm initial={editing} onSubmit={handleSubmit} onCancel={() => setFormOpen(false)} submitting={submitting} />
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Group"
        message={deleteMessage}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
