import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import SearchBar from '../components/SearchBar.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import CustomerTable from '../components/CustomerTable.jsx';
import Modal from '../components/Modal.jsx';
import CustomerForm from '../components/CustomerForm.jsx';
import GroupForm from '../components/GroupForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import CustomerDetailPanel from '../components/CustomerDetailPanel.jsx';
import { useToast } from '../components/Toast.jsx';

const FILTERS = [
  { value: 'ALL', label: 'Semua' },
  { value: 'PENDING', label: '🔴 Belum Follow Up' },
  { value: 'COMPLETED', label: '🟢 Dah Follow Up' },
];

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [group, setGroup] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [groups, setGroups] = useState([]); // for "Pindah Group" select
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('follow_up_status');
  const [sortDir, setSortDir] = useState('asc');

  // Modals
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [submittingCustomer, setSubmittingCustomer] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState(false);
  const [deleteCustomer, setDeleteCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [viewCustomer, setViewCustomer] = useState(null);

  const loadGroup = useCallback(async () => {
    const g = await api.getGroup(id);
    setGroup(g);
    return g;
  }, [id]);

  const loadCustomers = useCallback(async () => {
    const c = await api.groupCustomers(id);
    setCustomers(c);
  }, [id]);

  const loadAllGroups = useCallback(async () => {
    const gs = await api.listGroups();
    setGroups(gs);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadGroup(), loadCustomers(), loadAllGroups()]);
    } catch (e) {
      toast.error(e.message);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [loadGroup, loadCustomers, loadAllGroups, navigate, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // ---- Derived: search + filter + sort (client-side) ----
  const filtered = useMemo(() => {
    let list = customers;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.email_subscribe || '').toLowerCase().includes(q) ||
          (c.email_family || '').toLowerCase().includes(q)
      );
    }
    if (filter !== 'ALL') {
      list = list.filter((c) => c.follow_up_status === filter);
    }
    const sorted = [...list];
    const dir = sortDir === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      if (sortKey === 'follow_up_status') {
        const pa = a.follow_up_status === 'PENDING' ? 0 : 1;
        const pb = b.follow_up_status === 'PENDING' ? 0 : 1;
        if (pa !== pb) return (pa - pb) * dir;
        return a.name.localeCompare(b.name, 'ms');
      }
      if (sortKey === 'name') {
        return a.name.localeCompare(b.name, 'ms') * dir;
      }
      return String(a[sortKey] || '').localeCompare(String(b[sortKey] || '')) * dir;
    });
    return sorted;
  }, [customers, search, filter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // ---- Follow-up toggle (no full reload — update locally) ----
  const handleToggle = async (customer, status) => {
    try {
      const res = await api.toggleFollowUp(customer.id, status);
      setCustomers((list) =>
        list.map((c) => (c.id === customer.id ? { ...c, ...res.customer } : c))
      );
      setGroup(res.group);
      if (viewCustomer && viewCustomer.id === customer.id) {
        setViewCustomer((v) => ({ ...v, ...res.customer }));
      }
      toast.success(status === 'COMPLETED' ? 'Follow up berjaya direkodkan.' : 'Customer telah ditandakan sebagai belum follow up.');
    } catch (e) {
      toast.error(e.message);
    }
  };

  // ---- Customer CRUD ----
  const openAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerFormOpen(true);
  };
  const openEditCustomer = (c) => {
    setEditingCustomer(c);
    setCustomerFormOpen(true);
  };
  const handleSubmitCustomer = async (payload) => {
    setSubmittingCustomer(true);
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, payload);
        toast.success('Customer berjaya dikemaskini.');
      } else {
        await api.createCustomer(payload);
        toast.success('Customer berjaya ditambah.');
      }
      setCustomerFormOpen(false);
      setEditingCustomer(null);
      await Promise.all([loadGroup(), loadCustomers()]);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmittingCustomer(false);
    }
  };
  const handleDeleteCustomer = async () => {
    if (!deleteCustomer) return;
    setDeletingCustomer(true);
    try {
      await api.deleteCustomer(deleteCustomer.id);
      toast.success('Customer berjaya dipadam.');
      setDeleteCustomer(null);
      await Promise.all([loadGroup(), loadCustomers()]);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeletingCustomer(false);
    }
  };

  // ---- Group edit ----
  const handleSubmitGroup = async (payload) => {
    setSubmittingGroup(true);
    try {
      await api.updateGroup(id, payload);
      toast.success('Group berjaya dikemaskini.');
      setGroupFormOpen(false);
      loadGroup();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmittingGroup(false);
    }
  };

  if (loading) {
    return <p className="cell-muted" style={{ padding: 40 }}>Memuatkan...</p>;
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 4 }}>
            ← Kembali
          </button>
          <h1 style={{ textTransform: 'uppercase' }}>{group.name}</h1>
          <div className="sub">{group.description || '—'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => setGroupFormOpen(true)}>Edit Group</button>
          <button className="btn btn-primary" onClick={openAddCustomer}>+ Tambah Customer</button>
        </div>
      </div>

      <div className="content">
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <StatsLike label="Jumlah Customer" value={group.total_customers} tone="blue" />
          <StatsLike label="Dah Follow Up" value={group.completed} tone="green" />
          <StatsLike label="Belum Follow Up" value={group.pending} tone="red" />
        </div>

        <div className="toolbar">
          <FilterTabs options={FILTERS} value={filter} onChange={setFilter} />
          <SearchBar value={search} onChange={setSearch} placeholder="Cari nama / no WhatsApp / email..." />
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="🧑‍🤝‍🧑"
              title={
                customers.length === 0
                  ? 'Belum ada customer dalam group ini.'
                  : 'Tiada customer dijumpai.'
              }
              description={
                customers.length === 0 ? 'Tambahkan customer pertama anda.' : undefined
              }
              actionLabel={customers.length === 0 ? '+ Tambah Customer' : undefined}
              onAction={customers.length === 0 ? openAddCustomer : undefined}
            />
          </div>
        ) : (
          <CustomerTable
            customers={filtered}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
            onToggleFollowUp={handleToggle}
            onView={setViewCustomer}
            onEdit={openEditCustomer}
            onDelete={setDeleteCustomer}
          />
        )}
      </div>

      {customerFormOpen && (
        <Modal
          title={editingCustomer ? 'Edit Customer' : 'Tambah Customer'}
          onClose={() => setCustomerFormOpen(false)}
          wide
        >
          <CustomerForm
            initial={editingCustomer}
            groups={groups}
            onSubmit={handleSubmitCustomer}
            onCancel={() => setCustomerFormOpen(false)}
            submitting={submittingCustomer}
          />
        </Modal>
      )}

      {groupFormOpen && (
        <Modal title="Edit Group" onClose={() => setGroupFormOpen(false)}>
          <GroupForm
            initial={group}
            onSubmit={handleSubmitGroup}
            onCancel={() => setGroupFormOpen(false)}
            submitting={submittingGroup}
          />
        </Modal>
      )}

      <CustomerDetailPanel
        customer={viewCustomer}
        onToggle={handleToggle}
        onClose={() => setViewCustomer(null)}
      />

      <ConfirmDialog
        open={!!deleteCustomer}
        title="Delete Customer"
        message={`Adakah anda pasti mahu delete customer "${deleteCustomer?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteCustomer}
        onCancel={() => setDeleteCustomer(null)}
        loading={deletingCustomer}
      />
    </div>
  );
}

// Small inline stat card to match the dashboard look.
function StatsLike({ label, value, tone }) {
  const iconMap = { blue: '👥', green: '✅', red: '⏳' };
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{iconMap[tone]}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
