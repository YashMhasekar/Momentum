const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Convert ISO 8601 duration to seconds
export const parseDuration = (duration) => {
  if (!duration || typeof duration !== 'string') return 0;
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  return hours * 3600 + minutes * 60 + seconds;
};

// Search for videos
export const searchVideos = async (topic) => {
  try {
    // Use the user's query directly with "shorts" to find short-form content
    const searchQuery = `${topic} shorts`;
    const searchUrl = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(searchQuery)}&maxResults=30&type=video&videoDuration=short&key=${API_KEY}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    // Get video IDs
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    // Get video details including duration, status, and contentDetails
    const detailsUrl = `${BASE_URL}/videos?part=contentDetails,snippet,status&id=${videoIds}&key=${API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    // Filter videos - removed keyword filtering to accept any content
    const filteredVideos = detailsData.items
      .filter(video => {
        if (!video.contentDetails?.duration || !video.status || !video.snippet) return false;
        const duration = parseDuration(video.contentDetails.duration);
        const title = video.snippet.title;

        // CRITICAL FILTERS (removed keyword relevance check)
        const isEmbeddable = video.status.embeddable === true;
        const isPublic = video.status.privacyStatus === 'public';
        const isShortDuration = duration <= 60;

        // Log filtered out videos for debugging
        if (!isEmbeddable) {
          console.log('❌ Not embeddable:', title);
        }
        if (!isPublic) {
          console.log('❌ Not public:', title);
        }

        // Keep only videos that pass ALL filters
        return isEmbeddable && isPublic && isShortDuration;
      })
      .map(video => ({
        id: video.id,
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        // CORRECT EMBED URL FORMAT
        embedUrl: `https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`
      }));

    console.log(`✅ Found ${filteredVideos.length} playable videos out of ${detailsData.items.length} total`);

    return filteredVideos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
};

// Search for long lecture videos
export const searchLectures = async (topic) => {
  try {
    // Search for longer educational content
    const searchQuery = `${topic} tutorial lecture`;
    const searchUrl = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(searchQuery)}&maxResults=24&type=video&videoDuration=long&key=${API_KEY}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    // Get video IDs
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    // Get video details
    const detailsUrl = `${BASE_URL}/videos?part=contentDetails,snippet,status,statistics&id=${videoIds}&key=${API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    // Filter and format videos
    const filteredVideos = detailsData.items
      .filter(video => {
        if (!video.contentDetails?.duration || !video.status || !video.snippet) return false;
        const duration = parseDuration(video.contentDetails.duration);
        const title = video.snippet.title;

        // Filter for long videos (10+ minutes)
        const isEmbeddable = video.status.embeddable === true;
        const isPublic = video.status.privacyStatus === 'public';
        const isLongDuration = duration >= 600; // 10 minutes minimum

        if (!isEmbeddable) {
          console.log('❌ Not embeddable:', title);
        }

        return isEmbeddable && isPublic && isLongDuration;
      })
      .map(video => {
        const duration = parseDuration(video.contentDetails.duration);
        const views = formatViews(video.statistics.viewCount);
        const publishedAt = formatPublishedDate(video.snippet.publishedAt);

        return {
          id: video.id,
          title: video.snippet.title,
          channel: video.snippet.channelTitle,
          thumbnail: video.snippet.thumbnails.high.url,
          duration: duration,
          views: views,
          publishedAt: publishedAt,
          embedUrl: `https://www.youtube.com/embed/${video.id}?autoplay=1&controls=1&rel=0&modestbranding=1`
        };
      });

    console.log(`✅ Found ${filteredVideos.length} lecture videos out of ${detailsData.items.length} total`);

    return filteredVideos;
  } catch (error) {
    console.error('Error fetching lectures:', error);
    throw error;
  }
};

// Helper function to format view count
const formatViews = (viewCount) => {
  const count = parseInt(viewCount);
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
};

// Helper function to format published date
const formatPublishedDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} weeks ago`;
  } else if (diffDays < 365) {
    return `${Math.floor(diffDays / 30)} months ago`;
  } else {
    return `${Math.floor(diffDays / 365)} years ago`;
  }
};
