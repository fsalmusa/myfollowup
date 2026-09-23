import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import SearchBar from '../components/SearchBar.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import CustomerTable from '../components/CustomerTable.jsx';
import Modal from '../components/Modal.jsx';
import CustomerForm from '../components/CustomerForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import CustomerDetailPanel from '../components/CustomerDetailPanel.jsx';
import Pagination from '../components/Pagination.jsx';
import { RenewModal } from '../components/RenewButton.jsx';
import { useToast } from '../components/Toast.jsx';

const FOLLOWUP_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'PENDING', label: '🔴 Belum Follow Up' },
  { value: 'COMPLETED', label: '🟢 Dah Follow Up' },
];

const SUB_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'ACTIVE', label: '🟢 Aktif' },
  { value: 'EXPIRING_SOON', label: '🟠 Akan Expired' },
  { value: 'EXPIRED', label: '🔴 Expired' },
];

const SORT_OPTIONS = [
  { value: 'follow_up_status', label: 'Follow Up Status' },
  { value: 'name', label: 'Nama' },
  { value: 'subscribe_date', label: 'Tarikh Subscribe' },
  { value: 'expiry_date', label: 'Tarikh Expired' },
];

const PAGE_SIZE = 25;

export default function CustomerList() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [followUpFilter, setFollowUpFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [sort, setSort] = useState('follow_up_status');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        sort,
        ...(search ? { search } : {}),
        ...(groupFilter ? { group_id: groupFilter } : {}),
        ...(followUpFilter ? { follow_up_status: followUpFilter } : {}),
        ...(subFilter ? { subscription_status: subFilter } : {}),
      };
      const res = await api.listCustomers(params);
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, groupFilter, followUpFilter, subFilter, sort, toast]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    api.listGroups().then(setGroups).catch(() => {});
  }, []);

  // Reset to page 1 when filters change.
  const resetPage = (fn) => {
    setPage(1);
    fn();
  };

  const handleToggle = async (customer, status) => {
    try {
      const res = await api.toggleFollowUp(customer.id, status);
      setData((list) => list.map((c) => (c.id === customer.id ? { ...c, ...res.customer } : c)));
      toast.success(
        status === 'COMPLETED'
          ? 'Follow up berjaya direkodkan.'
          : 'Customer telah ditandakan sebagai belum follow up.'
      );
      // If filtered by follow-up status, refresh to keep the list accurate.
      if (followUpFilter) load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setFormOpen(true);
  };
  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) {
        await api.updateCustomer(editing.id, payload);
        toast.success('Customer berjaya dikemaskini.');
      } else {
        await api.createCustomer(payload);
        toast.success('Customer berjaya ditambah.');
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
      await api.deleteCustomer(deleteTarget.id);
      toast.success('Customer berjaya dipadam.');
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleRenewed = (updated) => {
    if (updated) {
      setData((list) => list.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    }
    // If filtered by subscription status, refresh to keep list accurate.
    if (subFilter) load();
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Senarai Customer</h1>
          <div className="sub">Semua customer merentas semua group</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Customer</button>
      </div>

      <div className="content">
        <div className="toolbar">
          <SearchBar value={search} onChange={(v) => resetPage(() => setSearch(v))} placeholder="Cari nama / no WhatsApp / email..." />
          <select className="form-control" style={{ width: 180 }} value={groupFilter} onChange={(e) => resetPage(() => setGroupFilter(e.target.value))}>
            <option value="">Semua Group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <select className="form-control" style={{ width: 170 }} value={sort} onChange={(e) => resetPage(() => setSort(e.target.value))}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Urut: {o.label}</option>
            ))}
          </select>
        </div>

        <div className="toolbar">
          <FilterTabs options={FOLLOWUP_FILTERS} value={followUpFilter} onChange={(v) => resetPage(() => setFollowUpFilter(v))} />
          <FilterTabs options={SUB_FILTERS} value={subFilter} onChange={(v) => resetPage(() => setSubFilter(v))} />
        </div>

        {loading ? (
          <p className="cell-muted">Memuatkan...</p>
        ) : data.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="🧑‍🤝‍🧑"
              title="Tiada customer dijumpai."
              description="Cuba ubah carian atau filter anda."
              actionLabel="+ Tambah Customer"
              onAction={openAdd}
            />
          </div>
        ) : (
          <>
            <CustomerTable
              customers={data}
              showGroup
              startIndex={(page - 1) * PAGE_SIZE + 1}
              sortKey={sort}
              sortDir="asc"
              onSort={(key) => setSort(key)}
              onToggleFollowUp={handleToggle}
              onView={setViewCustomer}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onRenew={setRenewTarget}
            />
            <Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} />
          </>
        )}
      </div>

      {formOpen && (
        <Modal title={editing ? 'Edit Customer' : 'Tambah Customer'} onClose={() => setFormOpen(false)} wide>
          <CustomerForm
            initial={editing}
            groups={groups}
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
            submitting={submitting}
          />
        </Modal>
      )}

      <CustomerDetailPanel customer={viewCustomer} onToggle={handleToggle} onClose={() => setViewCustomer(null)} />

      <RenewModal
        customer={renewTarget}
        onClose={() => setRenewTarget(null)}
        onRenewed={handleRenewed}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Adakah anda pasti mahu delete customer "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
