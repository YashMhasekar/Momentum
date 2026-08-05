import React, { useEffect, useRef, useState } from 'react';
import './VideoReel.css';

const VideoReel = ({ video, isVisible, userInteracted, isFirstVideo }) => {
  const iframeRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Control video playback based on visibility
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const controlPlayback = () => {
      try {
        if (isVisible) {
          console.log('▶️ Playing video:', video.id, 'Sound:', userInteracted ? 'ON' : 'OFF');
          
          // Control sound based on user interaction
          if (userInteracted) {
            iframe.contentWindow.postMessage(
              '{"event":"command","func":"unMute","args":""}',
              '*'
            );
            iframe.contentWindow.postMessage(
              '{"event":"command","func":"setVolume","args":[100]}',
              '*'
            );
          } else {
            iframe.contentWindow.postMessage(
              '{"event":"command","func":"mute","args":""}',
              '*'
            );
          }
          
          // Play the video
          iframe.contentWindow.postMessage(
            '{"event":"command","func":"playVideo","args":""}',
            '*'
          );
        } else {
          console.log('⏸️ Pausing video:', video.id);
          // Pause and mute when not visible
          iframe.contentWindow.postMessage(
            '{"event":"command","func":"pauseVideo","args":""}',
            '*'
          );
          iframe.contentWindow.postMessage(
            '{"event":"command","func":"mute","args":""}',
            '*'
          );
        }
      } catch (error) {
        console.error('Error controlling video:', error);
      }
    };

    // Wait for iframe to be ready, then control playback
    const timer = setTimeout(controlPlayback, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [isVisible, video.id, userInteracted]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    console.log('✅ Iframe loaded:', video.id);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setHasError(true);
    setIsLoading(false);
    console.error('❌ Iframe error:', video.id);
  };

  // Validate video after hooks
  if (!video || !video.embedUrl || !video.id) {
    return null;
  }

  // Generate embed URL based on interaction state
  const getEmbedUrl = () => {
    const baseUrl = video.embedUrl.split('?')[0];
    const muteParam = userInteracted ? 'mute=0' : 'mute=1';
    return `${baseUrl}?autoplay=1&${muteParam}&playsinline=1&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`;
  };

  // Show error state
  if (hasError) {
    return (
      <div className="video-reel">
        <div className="video-wrapper">
          <div className="video-error">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>Video unavailable</p>
          </div>
        </div>
        <div className="video-info-bottom">
          <h3 className="video-title">{video.title}</h3>
          <p className="video-channel">{video.channel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-reel">
      <div className="video-wrapper">
        {isLoading && (
          <div className="video-loading">
            <div className="spinner"></div>
          </div>
        )}
        
        {/* Sound indicator for first video */}
        {isFirstVideo && !userInteracted && isVisible && (
          <div className="sound-indicator">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
            <span>Tap for sound</span>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={getEmbedUrl()}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#000',
            display: isLoading ? 'none' : 'block'
          }}
        />
      </div>
      <div className="video-info-bottom">
        <h3 className="video-title">{video.title}</h3>
        <p className="video-channel">{video.channel}</p>
      </div>
    </div>
  );
};

export default VideoReel;
