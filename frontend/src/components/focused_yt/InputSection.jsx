import React, { useState } from 'react';
import './InputSection.css';

const InputSection = ({ onLoadContent, loading, contentType }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim()) {
      onLoadContent(topic.trim());
    }
  };

  const getPlaceholder = () => {
    if (contentType === 'shorts') {
      return 'Search short reels... (e.g., cooking, fitness, coding)';
    }
    return 'Search lectures... (e.g., python tutorial, web development)';
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    return contentType === 'shorts' ? 'Load Reels' : 'Load Lectures';
  };

  return (
    <div className="input-section">
      <div className="input-container">
        <h1 className="app-title">
          {contentType === 'shorts' ? '📱 Short Reels' : '🎓 Long Lectures'}
        </h1>
        <p className="app-subtitle">
          {contentType === 'shorts' 
            ? 'Discover quick videos on any topic' 
            : 'Find in-depth tutorials and courses'}
        </p>
        
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={getPlaceholder()}
            className="topic-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="load-button"
            disabled={loading || !topic.trim()}
          >
            {getButtonText()}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputSection;
