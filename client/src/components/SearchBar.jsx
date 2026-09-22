import React from 'react';

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-bar">
      <span className="icon">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Cari...'}
      />
    </div>
  );
}
