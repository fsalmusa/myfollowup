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

// ===== MOBILE CARD VIEW =====
function CustomerCards({
  customers,
  showGroup,
  startIndex,
  onToggleFollowUp,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="customer-cards">
      {customers.map((c, i) => (
        <div className="cc-card" key={c.id}>
          <div className="cc-head">
            <div className="cc-name">
              <span className="cc-num">{startIndex + i}</span>
              <div>
                <div className="cc-name-text">{c.name}</div>
                {showGroup && c.group_name && (
                  <div className="cc-group">👥 {c.group_name}</div>
                )}
              </div>
            </div>
            <SubscriptionBadge status={c.subscription_status} />
          </div>

          <div className="cc-body">
            <div className="cc-row">
              <span className="cc-label">No WhatsApp</span>
              <span className="cc-value">{c.phone_display || '—'}</span>
            </div>
            <div className="cc-row">
              <span className="cc-label">Email Subscribe</span>
              <span className="cc-value">{c.email_subscribe || '—'}</span>
            </div>
            <div className="cc-row">
              <span className="cc-label">Email Family</span>
              <span className="cc-value">{c.email_family || '—'}</span>
            </div>
            <div className="cc-row">
              <span className="cc-label">Subscribe</span>
              <span className="cc-value">{c.subscribe_date_display || '—'}</span>
            </div>
            <div className="cc-row">
              <span className="cc-label">Expired</span>
              <span className="cc-value">{c.expiry_date_display || '—'}</span>
            </div>
          </div>

          <div className="cc-actions">
            <FollowUpButton customer={c} onToggle={(status) => onToggleFollowUp(c, status)} />
            <WhatsAppButton phone={c.phone} name={c.name} />
            <Dropdown
              items={[
                { icon: '👁️', label: 'Lihat Detail', onClick: () => onView(c) },
                { icon: '✏️', label: 'Edit Customer', onClick: () => onEdit(c) },
                { icon: '🗑️', label: 'Delete Customer', danger: true, onClick: () => onDelete(c) },
              ]}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== DESKTOP TABLE VIEW =====
function CustomerTableDesktop({
  customers,
  showGroup,
  startIndex,
  sortKey,
  sortDir,
  onSort,
  onToggleFollowUp,
  onView,
  onEdit,
  onDelete,
}) {
  return (
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
  );
}

// ===== RESPONSIVE WRAPPER =====
export default function CustomerTable(props) {
  return (
    <div className="table-wrap">
      <div className="ct-mobile">
        <CustomerCards {...props} />
      </div>
      <div className="ct-desktop">
        <CustomerTableDesktop {...props} />
      </div>
    </div>
  );
}
