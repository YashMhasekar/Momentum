import React from 'react';
import VideoCard from './VideoCard';
import './LecturesGrid.css';

const LecturesGrid = ({ videos, onBack }) => {
  return (
    <div className="lectures-wrapper">
      <button className="back-button-lectures" onClick={onBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
      
      <div className="lectures-header">
        <h2>Long Lectures</h2>
        <p>{videos.length} videos found</p>
      </div>

      <div className="lectures-grid">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default LecturesGrid;
