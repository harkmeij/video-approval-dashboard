import React from 'react';

const Spinner = () => {
  return (
    <div className="loading-spinner py-5">
      <div className="spinner-border" style={{ color: 'var(--brand-color)', width: '2.5rem', height: '2.5rem', borderWidth: '0.2rem' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 text-muted" style={{ fontSize: '0.95rem', fontWeight: '500' }}>Loading...</p>
    </div>
  );
};

export default Spinner;
