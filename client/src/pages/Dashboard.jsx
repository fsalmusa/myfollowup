import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import StatsCard from '../components/StatsCard.jsx';
import GroupCard from '../components/GroupCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Modal from '../components/Modal.jsx';
import GroupForm from '../components/GroupForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Dashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Group form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, g] = await Promise.all([api.stats(), api.listGroups(search)]);
      setStats(s);
      setGroups(g);
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
          <h1>Dashboard</h1>
          <div className="sub">Ringkasan keseluruhan follow-up pelanggan</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Tambah Group
        </button>
      </div>

      <div className="content">
        <div className="stats-grid">
          <StatsCard label="Jumlah Group" value={stats ? stats.total_groups : '—'} tone="blue" />
          <StatsCard label="Jumlah Customer" value={stats ? stats.total_customers : '—'} tone="purple" />
          <StatsCard label="Dah Follow Up" value={stats ? stats.followed_up : '—'} tone="green" />
          <StatsCard label="Belum Follow Up" value={stats ? stats.not_followed_up : '—'} tone="red" />
        </div>

        <div className="section-head">
          <h2>Senarai Group</h2>
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
          <div className="group-grid">
            {groups.map((g) => (
              <GroupCard key={g.id} group={g} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <Modal title={editing ? 'Edit Group' : 'Tambah Group'} onClose={() => setFormOpen(false)}>
          <GroupForm
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
            submitting={submitting}
          />
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
