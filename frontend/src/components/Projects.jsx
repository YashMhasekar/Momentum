import React, { useState, useEffect } from 'react';
import { FaGithub, FaStar, FaCodeBranch, FaEye, FaExclamationCircle, FaPlus, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

function Projects() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repoUrl: '',
    tags: '',
    coverImage: '',
    isPublic: true
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch projects from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    const projectsRef = collection(db, 'projects');
    const q = query(
      projectsRef,
      where('userId', '==', currentUser.uid),
      orderBy('lastUpdated', 'desc')
    );
    
    // Set up real-time listener instead of one-time fetch
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedProjects = [];
      
      querySnapshot.forEach((doc) => {
        fetchedProjects.push({
          id: doc.id,
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate()
        });
      });
      
      setProjects(fetchedProjects);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setError("Failed to load projects. Please try again later.");
      setLoading(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  // Get unique tags for filter options
  const uniqueTags = Array.from(new Set(projects.flatMap(project => project.tags))).sort();

  // Filter projects based on tags and search query
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') {
      return matchesSearch;
    } else {
      return project.tags.includes(filter) && matchesSearch;
    }
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file selection for cover image
  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload cover image to Firebase Storage
  const uploadCoverImage = async (projectId) => {
    if (!selectedFile) return null;
    
    const storageRef = ref(storage, `project_covers/${currentUser.uid}/${projectId || 'new'}_${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  // Open add project modal
  const handleAddProject = () => {
    setFormData({
      name: '',
      description: '',
      repoUrl: '',
      tags: '',
      coverImage: '',
      isPublic: true
    });
    setSelectedFile(null);
    setUploadProgress(0);
    setError('');
    setShowAddModal(true);
  };

  // Open edit project modal
  const handleEditProject = (project) => {
    setCurrentProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      repoUrl: project.repoUrl,
      tags: project.tags.join(', '),
      coverImage: project.coverImage,
      isPublic: project.isPublic
    });
    setSelectedFile(null);
    setUploadProgress(0);
    setError('');
    setShowEditModal(true);
  };

  // Save new project
  const handleSaveNewProject = async () => {
    if (!formData.name || !formData.description || !formData.repoUrl) {
      setError("Please fill in all required fields");
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      let coverImageUrl = formData.coverImage;
      
      // Upload cover image if selected
      if (selectedFile) {
        coverImageUrl = await uploadCoverImage();
      }
      
      // Prepare project data
      const projectData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        userEmail: currentUser.email,
        name: formData.name,
        description: formData.description,
        repoUrl: formData.repoUrl,
        tags: tagsArray,
        stars: 0,
        forks: 0,
        watchers: 0,
        openIssues: 0,
        lastUpdated: Timestamp.now(),
        createdAt: Timestamp.now(),
        coverImage: coverImageUrl || 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        isPublic: formData.isPublic
      };
      
      // Add project to Firestore
      const docRef = await addDoc(collection(db, 'projects'), projectData);
      
      // Add the project to local state
      setProjects([{
        id: docRef.id,
        ...projectData,
        lastUpdated: projectData.lastUpdated.toDate()
      }, ...projects]);
      
      setShowAddModal(false);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error adding project:", error);
      setError("Failed to save project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Save edited project
  const handleSaveEditedProject = async () => {
    if (!formData.name || !formData.description || !formData.repoUrl) {
      setError("Please fill in all required fields");
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      let coverImageUrl = formData.coverImage;
      
      // Upload cover image if selected
      if (selectedFile) {
        coverImageUrl = await uploadCoverImage(currentProject.id);
      }
      
      // Prepare updated project data
      const updatedData = {
        name: formData.name,
        description: formData.description,
        repoUrl: formData.repoUrl,
        tags: tagsArray,
        lastUpdated: Timestamp.now()
      };
      
      // Only update the cover image if it changed
      if (coverImageUrl !== currentProject.coverImage) {
        updatedData.coverImage = coverImageUrl;
      }
      
      // Update project in Firestore
      const projectRef = doc(db, 'projects', currentProject.id);
      await updateDoc(projectRef, updatedData);
      
      // Update project in local state
      const updatedProjects = projects.map(project => 
        project.id === currentProject.id 
          ? {
              ...project,
              ...updatedData,
              lastUpdated: updatedData.lastUpdated.toDate()
            }
          : project
      );
      
      setProjects(updatedProjects);
      setShowEditModal(false);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error updating project:", error);
      setError("Failed to update project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Delete project
  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        // Delete project from Firestore
        const projectRef = doc(db, 'projects', id);
        await deleteDoc(projectRef);
        
        // Remove project from local state
        setProjects(projects.filter(project => project.id !== id));
      } catch (error) {
        console.error("Error deleting project:", error);
        setError("Failed to delete project. Please try again.");
      }
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-blue-600 w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Open Source Projects</h2>
        <button 
          onClick={handleAddProject}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="mr-2" /> Add Project
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="md:w-1/2">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="md:w-1/2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Projects</option>
            {uniqueTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery || filter !== 'all' 
            ? "No projects found matching your criteria." 
            : "You haven't added any projects yet. Click 'Add Project' to get started."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map(project => (
            <div key={project.id} className="border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
              {/* Project Cover Image */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={project.coverImage} 
                  alt={project.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";
                  }}
                />
                <div className="absolute top-2 right-2 space-x-2">
                  <button 
                    onClick={() => handleEditProject(project)}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors"
                  >
                    <FaEdit className="text-gray-600" />
                  </button>
                  <button 
                    onClick={() => handleDeleteProject(project.id)}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors"
                  >
                    <FaTrash className="text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Project Info */}
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {project.name}
                  {project.isPublic && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Public
                    </span>
                  )}
                  {!project.isPublic && (
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      Private
                    </span>
                  )}
                </h3>
                <p className="text-gray-600 mb-4 flex-grow">{project.description}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map(tag => (
                    <span 
                      key={`${project.id}-${tag}`} 
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Stats */}
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center"><FaStar className="mr-1 text-yellow-400" /> {project.stars}</span>
                    <span className="flex items-center"><FaCodeBranch className="mr-1" /> {project.forks}</span>
                    <span className="flex items-center"><FaEye className="mr-1" /> {project.watchers}</span>
                    <span className="flex items-center"><FaExclamationCircle className="mr-1 text-red-500" /> {project.openIssues}</span>
                  </div>
                  <span>Updated {formatDate(project.lastUpdated)}</span>
                </div>
                
                {/* Repository Link */}
                <a 
                  href={project.repoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg transition-colors"
                >
                  <FaGithub className="mr-2" /> View Repository
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add New Project</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL*</label>
                <input
                  type="url"
                  name="repoUrl"
                  value={formData.repoUrl}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleFormChange}
                  placeholder="React, JavaScript, UI"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                <div className="flex flex-col space-y-2">
                  <input
                    type="url"
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleFormChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-500">Or upload an image:</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      id="coverImageUpload"
                      onChange={handleFileSelect} 
                    />
                    <label 
                      htmlFor="coverImageUpload"
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                  
                  {selectedFile && (
                    <div className="text-sm text-gray-600">
                      Selected: {selectedFile.name}
                    </div>
                  )}
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Visibility
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                    Make this project public
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Public projects will be visible to other users who can reach out to collaborate. Private projects are only visible to you.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:bg-blue-400"
                disabled={saving || !formData.name || !formData.description || !formData.repoUrl}
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Project'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Project</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL*</label>
                <input
                  type="url"
                  name="repoUrl"
                  value={formData.repoUrl}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                <div className="flex flex-col space-y-2">
                  <div className="w-full h-32 border border-gray-300 rounded-lg overflow-hidden mb-2">
                    <img 
                      src={formData.coverImage} 
                      alt="Current cover"
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";
                      }}
                    />
                  </div>
                  <input
                    type="url"
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-500">Or upload a new image:</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      id="editCoverImageUpload"
                      onChange={handleFileSelect} 
                    />
                    <label 
                      htmlFor="editCoverImageUpload"
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                  
                  {selectedFile && (
                    <div className="text-sm text-gray-600">
                      Selected: {selectedFile.name}
                    </div>
                  )}
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:bg-blue-400"
                disabled={saving || !formData.name || !formData.description || !formData.repoUrl}
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects; 