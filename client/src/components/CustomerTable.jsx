import React from 'react';
import { SubscriptionBadge } from './StatusBadge.jsx';
import WhatsAppButton from './WhatsAppButton.jsx';
import FollowUpButton from './FollowUpButton.jsx';
import Dropdown from './Dropdown.jsx';

function SortableTh({ label, sortKey, activeKey, dir, onSort }) {
  const active = activeKey === sortKey;
  const arrow = active ? (dir === 'asc' ? ' ↑' : ' ↓') : '';
  return (
    <th onClick={() => onSort(sortKey)}>
      {label}
      <span className="sort-ind">{arrow}</span>
    </th>
  );
}

export default function CustomerTable({
  customers,
  showGroup = false,
  startIndex = 1,
  sortKey,
  sortDir,
  onSort,
  onToggleFollowUp,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="table-wrap">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>No</th>
              <SortableTh label="Nama" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={onSort} />
              {showGroup && <th>Group</th>}
              <th>No WhatsApp</th>
              <th>Email Subscribe</th>
              <th>Email Family</th>
              <SortableTh label="Tarikh Subscribe" sortKey="subscribe_date" activeKey={sortKey} dir={sortDir} onSort={onSort} />
              <SortableTh label="Tarikh Expired" sortKey="expiry_date" activeKey={sortKey} dir={sortDir} onSort={onSort} />
              <th>Status Langganan</th>
              <th>WhatsApp</th>
              <SortableTh label="Follow Up" sortKey="follow_up_status" activeKey={sortKey} dir={sortDir} onSort={onSort} />
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={c.id}>
                <td className="cell-muted">{startIndex + i}</td>
                <td>
                  <div className="cell-name">{c.name}</div>
                  <div className="cell-sub">{c.email_subscribe || ''}</div>
                </td>
                {showGroup && <td className="cell-muted">{c.group_name}</td>}
                <td>{c.phone_display || <span className="cell-empty">—</span>}</td>
                <td className="cell-muted">{c.email_subscribe || <span className="cell-empty">—</span>}</td>
                <td className="cell-muted">{c.email_family || <span className="cell-empty">—</span>}</td>
                <td className="cell-muted">{c.subscribe_date_display || '—'}</td>
                <td className="cell-muted">{c.expiry_date_display || '—'}</td>
                <td>
                  <SubscriptionBadge status={c.subscription_status} />
                </td>
                <td>
                  <WhatsAppButton phone={c.phone} name={c.name} />
                </td>
                <td>
                  <FollowUpButton customer={c} onToggle={(status) => onToggleFollowUp(c, status)} />
                </td>
                <td>
                  <Dropdown
                    items={[
                      { icon: '👁️', label: 'Lihat Detail', onClick: () => onView(c) },
                      { icon: '✏️', label: 'Edit Customer', onClick: () => onEdit(c) },
                      { icon: '🗑️', label: 'Delete Customer', danger: true, onClick: () => onDelete(c) },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
