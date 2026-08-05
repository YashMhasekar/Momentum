import React from 'react';
import './EmptyState.css';

const EmptyState = ({ onBack }) => {
  return (
    <div className="empty-state">
      <div className="empty-content">
        <h2 className="empty-title">No reels found</h2>
        <p className="empty-message">
          Try a different topic or check your internet connection
        </p>
        <button onClick={onBack} className="back-button">
          Try Another Topic
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
