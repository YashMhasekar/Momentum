import React from 'react';
import './TabNavigation.css';

const TabNavigation = ({ activeTab, onTabChange }) => {
  return (
    <div className="tab-navigation">
      <button
        className={`tab-button ${activeTab === 'shorts' ? 'active' : ''}`}
        onClick={() => onTabChange('shorts')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2" />
        </svg>
        Short Reels
      </button>
      <button
        className={`tab-button ${activeTab === 'lectures' ? 'active' : ''}`}
        onClick={() => onTabChange('lectures')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        Long Lectures
      </button>
    </div>
  );
};

export default TabNavigation;
