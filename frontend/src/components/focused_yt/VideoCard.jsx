import React, { useState } from 'react';
import './VideoCard.css';

const VideoCard = ({ video }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-card">
      <div className="video-card-thumbnail">
        {!isPlaying ? (
          <>
            <img src={video.thumbnail} alt={video.title} />
            <div className="video-overlay" onClick={handlePlayClick}>
              <div className="play-button">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
            <div className="video-duration">{formatDuration(video.duration)}</div>
          </>
        ) : (
          <iframe
            src={video.embedUrl}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="video-iframe"
          />
        )}
      </div>
      
      <div className="video-card-info">
        <h3 className="video-card-title">{video.title}</h3>
        <p className="video-card-channel">{video.channel}</p>
        <div className="video-card-meta">
          <span>{video.views}</span>
          <span>•</span>
          <span>{video.publishedAt}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
