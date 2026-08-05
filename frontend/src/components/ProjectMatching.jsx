import React, { useState, useEffect } from 'react';
import { FaSearch, FaCode, FaStar, FaCodeBranch, FaUser, FaExclamationCircle, FaFilter, FaHeart, FaRegHeart, FaSpinner, FaEnvelope } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

function ProjectMatching() {
  const { currentUser } = useAuth();
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [difficultyLevel, setDifficultyLevel] = useState('all');
  const [helpWanted, setHelpWanted] = useState(false);
  const [goodFirstIssue, setGoodFirstIssue] = useState(false);
  
  // State for projects
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for liked projects
  const [likedProjects, setLikedProjects] = useState([]);
  
  // Available filter options
  const languages = ['JavaScript', 'Python', 'Java', 'TypeScript', 'C#', 'PHP', 'Go', 'Ruby', 'C++', 'Rust'];
  const categories = ['Web Development', 'Data Science', 'Machine Learning', 'Mobile Apps', 'DevOps', 'Security', 'UI/UX', 'Game Development', 'Blockchain'];
  
  // Fetch public projects from Firestore
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError('');
        
        const projectsRef = collection(db, 'projects');
        
        // Use a simpler query that doesn't require a composite index
        // First, get public projects
        const q = query(
          projectsRef,
          where('isPublic', '==', true),
          limit(50)
        );
        
        let fetchedProjects = [];
        let retryCount = 0;
        const maxRetries = 3;
        
        const attemptFetch = async () => {
          try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
              const projectData = doc.data();
              fetchedProjects.push({
                id: doc.id,
                name: projectData.name,
                description: projectData.description,
                language: projectData.tags[0] || 'Unknown',  // Using the first tag as language
                tags: projectData.tags || [],
                stars: projectData.stars || 0,
                forks: projectData.forks || 0,
                issues: projectData.openIssues || 0,
                category: projectData.tags[1] || 'Other',  // Using the second tag as category
                difficulty: 'medium',  // Default value
                helpWanted: true,  // All public projects are assumed to want help
                goodFirstIssue: projectData.tags.some(tag => 
                  tag.toLowerCase().includes('beginner') || 
                  tag.toLowerCase().includes('starter') || 
                  tag.toLowerCase().includes('easy')
                ),
                owner: {
                  id: projectData.userId,
                  name: projectData.userName || 'Unknown',
                  email: projectData.userEmail,
                  avatar: 'https://randomuser.me/api/portraits/persons/' + (Math.floor(Math.random() * 70) + 1) + '.jpg'
                },
                repoUrl: projectData.repoUrl,
                coverImage: projectData.coverImage,
                lastUpdated: projectData.lastUpdated?.toDate() || new Date()
              });
            });
            
            return true;
          } catch (err) {
            console.error("Error in fetch attempt:", err);
            
            // Check if it's a network-related error
            if (err.code === 'unavailable' || err.message.includes('network') || err.name === 'FirebaseError' && err.code === 'permission-denied') {
              // Network-related error - might be fixed with retry
              if (retryCount < maxRetries && navigator.onLine) {
                retryCount++;
                console.log(`Retrying projects fetch (${retryCount}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
                return await attemptFetch();
              } else {
                throw err; // Give up after max retries
              }
            } else {
              throw err; // Not a network error, don't retry
            }
          }
        };
        
        // Attempt the fetch operation
        await attemptFetch();
        
        // Sort projects by lastUpdated manually instead of in the query
        fetchedProjects.sort((a, b) => b.lastUpdated - a.lastUpdated);
        
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        
        if (!navigator.onLine) {
          setError("You appear to be offline. Please check your connection and try again.");
        } else if (error.name === 'FirebaseError' && error.code === 'permission-denied') {
          setError("Access to project data is restricted. Please log in to view projects.");
        } else {
          setError("Failed to load projects. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // Toggle language selection
  const toggleLanguage = (language) => {
    if (selectedLanguages.includes(language)) {
      setSelectedLanguages(selectedLanguages.filter(lang => lang !== language));
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };
  
  // Toggle category selection
  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  // Toggle project like
  const toggleLike = (projectId) => {
    if (likedProjects.includes(projectId)) {
      setLikedProjects(likedProjects.filter(id => id !== projectId));
    } else {
      setLikedProjects([...likedProjects, projectId]);
    }
  };
  
  // Apply filters to projects
  const filteredProjects = projects.filter(project => {
    // Search query filter
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Language filter
    const matchesLanguage = selectedLanguages.length === 0 || selectedLanguages.includes(project.language);
    
    // Category filter
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(project.category);
    
    // Difficulty filter
    const matchesDifficulty = difficultyLevel === 'all' || project.difficulty === difficultyLevel;
    
    // Help wanted filter
    const matchesHelpWanted = !helpWanted || project.helpWanted;
    
    // Good first issue filter
    const matchesGoodFirstIssue = !goodFirstIssue || project.goodFirstIssue;
    
    return matchesSearch && matchesLanguage && matchesCategory && matchesDifficulty && matchesHelpWanted && matchesGoodFirstIssue;
  });
  
  // Format large numbers with k, m suffixes
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'm';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Open Source Projects to Contribute</h2>
        
        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search for projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors md:w-auto w-full"
            >
              <FaFilter />
              <span>Filters</span>
            </button>
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-5 space-y-5">
              {/* Programming Languages */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Programming Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {languages.map(language => (
                    <button
                      key={language}
                      onClick={() => toggleLanguage(language)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedLanguages.includes(language)
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Categories */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedCategories.includes(category)
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Difficulty Level */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Difficulty Level</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDifficultyLevel('all')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      difficultyLevel === 'all'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    All Levels
                  </button>
                  <button
                    onClick={() => setDifficultyLevel('easy')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      difficultyLevel === 'easy'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    Easy
                  </button>
                  <button
                    onClick={() => setDifficultyLevel('medium')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      difficultyLevel === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setDifficultyLevel('hard')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      difficultyLevel === 'hard'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    Hard
                  </button>
                </div>
              </div>
              
              {/* Additional Filters */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Additional Filters</h3>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={helpWanted}
                      onChange={() => setHelpWanted(!helpWanted)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Help Wanted</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={goodFirstIssue}
                      onChange={() => setGoodFirstIssue(!goodFirstIssue)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Good First Issue</span>
                  </label>
                </div>
              </div>
              
              {/* Clear Filters */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedLanguages([]);
                    setSelectedCategories([]);
                    setDifficultyLevel('all');
                    setHelpWanted(false);
                    setGoodFirstIssue(false);
                  }}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Project Results */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FaSearch className="mx-auto text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No projects found</h3>
            <p className="text-gray-500">Try adjusting your search or filters to find more projects</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProjects.map(project => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800 truncate">{project.name}</h3>
                  <button 
                    onClick={() => toggleLike(project.id)}
                    className="text-red-500 focus:outline-none"
                  >
                    {likedProjects.includes(project.id) ? (
                      <FaHeart />
                    ) : (
                      <FaRegHeart />
                    )}
                  </button>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
                
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    <FaCode className="mr-1" /> {project.language}
                  </span>
                  
                  {project.tags.slice(0, 3).map((tag, index) => (
                    <span key={`${project.id}-tag-${index}`} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 text-sm text-gray-500">
                  {/* Project Owner */}
                  <div className="flex items-center gap-2">
                    <img 
                      src={project.owner.avatar} 
                      alt={project.owner.name} 
                      className="w-6 h-6 rounded-full"
                    />
                    <span>{project.owner.name}</span>
                  </div>
                  
                  {/* Project Stats */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1">
                      <FaStar className="text-yellow-500" />
                      <span>{formatNumber(project.stars)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <FaCodeBranch className="text-gray-500" />
                      <span>{formatNumber(project.forks)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <FaExclamationCircle className="text-red-500" />
                      <span>{project.issues} open issues</span>
                    </div>
                  </div>
                  
                  {/* View Project Button */}
                  <div className="flex gap-2">
                    <a 
                      href={project.repoUrl} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-medium transition-colors"
                    >
                      View Repo
                    </a>
                    {currentUser && project.owner.id !== currentUser.uid && (
                      <Link 
                        to={`/messages?recipient=${project.owner.id}&recipientName=${project.owner.name}&subject=Interested in ${project.name}`}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center"
                      >
                        <FaEnvelope className="mr-1" /> Contact
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectMatching; 