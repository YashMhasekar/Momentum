import React, { useEffect, useRef, useState } from 'react';
import VideoReel from './VideoReel';
import './ReelsContainer.css';

const ReelsContainer = ({ videos, onBack }) => {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);

  // Set first video as active on mount
  useEffect(() => {
    setActiveIndex(0);
    console.log('✅ Initial video set to index 0');
  }, []);

  // Detect user interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted) {
        console.log('🎵 User interacted - enabling sound for all videos');
        setUserInteracted(true);
      }
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleInteraction, { passive: true });
    container.addEventListener('click', handleInteraction);
    container.addEventListener('touchstart', handleInteraction, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleInteraction);
      container.removeEventListener('click', handleInteraction);
      container.removeEventListener('touchstart', handleInteraction);
    };
  }, [userInteracted]);

  // Handle scroll-based video switching
  useEffect(() => {
    const container = containerRef.current;
    if (!container || videos.length === 0) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      
      // Calculate current video index
      const index = Math.round(scrollTop / height);
      
      // Validate index to prevent NaN
      if (isNaN(index) || index < 0 || index >= videos.length) {
        return;
      }
      
      // Only update if index changed
      if (index !== activeIndex) {
        console.log('📺 Active Index:', index);
        setActiveIndex(index);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [videos, activeIndex]);

  return (
    <div className="reels-wrapper">
      <button className="back-button-reels" onClick={onBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
      <div className="reels-container" ref={containerRef}>
        {videos.map((video, index) => (
          <div key={video.id} data-index={index}>
            <VideoReel 
              video={video} 
              isVisible={index === activeIndex}
              userInteracted={userInteracted}
              isFirstVideo={index === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReelsContainer;
