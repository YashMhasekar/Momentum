const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GITHUB_API = 'https://api.github.com';

// Fetch GitHub user profile
export const fetchGitHubProfile = async (username) => {
  try {
    const response = await fetch(`${GITHUB_API}/users/${username}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('GitHub user not found');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub profile:', error);
    throw error;
  }
};

// Fetch user repositories
export const fetchGitHubRepos = async (username) => {
  try {
    const response = await fetch(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    throw error;
  }
};

// Extract skills from repositories
export const extractSkillsFromRepos = async (username) => {
  try {
    const repos = await fetchGitHubRepos(username);
    
    // Count language usage
    const languageCount = {};
    repos.forEach(repo => {
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      }
    });

    // Sort by usage and get top skills
    const skills = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .map(([language]) => language)
      .slice(0, 10); // Top 10 skills

    // Add common frameworks/tools based on repo names and descriptions
    const frameworks = new Set();
    repos.forEach(repo => {
      const text = `${repo.name} ${repo.description || ''}`.toLowerCase();
      
      // Frontend frameworks
      if (text.includes('react')) frameworks.add('React.js');
      if (text.includes('vue')) frameworks.add('Vue.js');
      if (text.includes('angular')) frameworks.add('Angular');
      if (text.includes('next')) frameworks.add('Next.js');
      
      // Backend frameworks
      if (text.includes('node') || text.includes('express')) frameworks.add('Node.js');
      if (text.includes('django')) frameworks.add('Django');
      if (text.includes('flask')) frameworks.add('Flask');
      if (text.includes('spring')) frameworks.add('Spring Boot');
      
      // Databases
      if (text.includes('mongo')) frameworks.add('MongoDB');
      if (text.includes('postgres') || text.includes('postgresql')) frameworks.add('PostgreSQL');
      if (text.includes('mysql')) frameworks.add('MySQL');
      if (text.includes('firebase')) frameworks.add('Firebase');
      
      // Cloud & DevOps
      if (text.includes('docker')) frameworks.add('Docker');
      if (text.includes('kubernetes')) frameworks.add('Kubernetes');
      if (text.includes('aws')) frameworks.add('AWS');
      if (text.includes('azure')) frameworks.add('Azure');
      
      // Other tools
      if (text.includes('tensorflow') || text.includes('keras')) frameworks.add('TensorFlow');
      if (text.includes('pytorch')) frameworks.add('PyTorch');
      if (text.includes('git')) frameworks.add('Git');
    });

    return {
      languages: skills,
      frameworks: Array.from(frameworks),
      totalRepos: repos.length,
      publicRepos: repos.filter(r => !r.private).length
    };
  } catch (error) {
    console.error('Error extracting skills:', error);
    throw error;
  }
};

// Get GitHub stats
export const getGitHubStats = async (username) => {
  try {
    const [profile, repos] = await Promise.all([
      fetchGitHubProfile(username),
      fetchGitHubRepos(username)
    ]);

    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

    return {
      followers: profile.followers,
      following: profile.following,
      publicRepos: profile.public_repos,
      totalStars,
      totalForks,
      bio: profile.bio,
      location: profile.location,
      avatarUrl: profile.avatar_url,
      profileUrl: profile.html_url
    };
  } catch (error) {
    console.error('Error fetching GitHub stats:', error);
    throw error;
  }
};
