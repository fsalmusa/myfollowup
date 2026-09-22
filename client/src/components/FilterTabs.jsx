import React from 'react';

export default function FilterTabs({ options, value, onChange }) {
  return (
    <div className="filter-tabs">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`filter-tab ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
