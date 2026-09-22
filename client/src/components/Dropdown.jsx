import React, { useEffect, useRef, useState } from 'react';

export default function Dropdown({ items, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="btn-icon" onClick={() => setOpen((o) => !o)} title="Menu">
        ⋮
      </button>
      {open && (
        <div className="menu">
          {items.map((item, i) => (
            <button
              key={i}
              className={`menu-item ${item.danger ? 'danger' : ''}`}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              <span>{item.icon || ''}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
