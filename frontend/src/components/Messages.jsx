import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTrash, FaStar, FaRegStar, FaArchive, FaReply, FaFilter, FaSpinner, FaEnvelope, FaEnvelopeOpen, FaUser, FaPaperPlane, FaCheck } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  Timestamp,
  onSnapshot,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

function Messages() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  
  const messageEndRef = useRef(null);
  
  // ValidateRecipient component definition
  const ValidateRecipient = ({ recipient }) => {
    const [validationStatus, setValidationStatus] = useState('checking');
    const [validatedUser, setValidatedUser] = useState(null);
    
    useEffect(() => {
      // Reset validation when recipient changes
      setValidationStatus('checking');
      setValidatedUser(null);
      
      // Don't check short inputs
      if (recipient.length < 3) {
        setValidationStatus('too_short');
        return;
      }
      
      const checkRecipient = async () => {
        try {
          // If it's an email
          if (recipient.includes('@')) {
            // Look for users with this email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', recipient), limit(1));
            const userSnapshot = await getDocs(q);
            
            if (!userSnapshot.empty) {
              // User found
              const userData = userSnapshot.docs[0].data();
              setValidatedUser({
                id: userSnapshot.docs[0].id,
                name: userData.displayName || recipient.split('@')[0],
                email: userData.email || recipient
              });
              setValidationStatus('valid');
            } else {
              // User not found, but email is valid
              setValidationStatus('email_not_registered');
            }
          } else {
            // If it's a user ID
            const userRef = doc(db, 'users', recipient);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              setValidatedUser({
                id: recipient,
                name: userData.displayName || recipient,
                email: userData.email || recipient
              });
              setValidationStatus('valid');
            } else {
              setValidationStatus('user_not_found');
            }
          }
        } catch (error) {
          console.error("Error validating recipient:", error);
          setValidationStatus('error');
        }
      };
      
      // Use debounce to avoid too many checks
      const timer = setTimeout(() => {
        checkRecipient();
      }, 500);
      
      return () => clearTimeout(timer);
    }, [recipient]);
    
    // Render appropriate message based on validation status
    if (validationStatus === 'checking' || validationStatus === 'too_short') {
      return null;
    }
    
    if (validationStatus === 'valid' && validatedUser) {
      return (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
            <FaCheck className="text-green-600 text-xs" />
          </span>
          <div>
            <span className="text-green-800 text-sm font-medium">
              {validatedUser.name}
            </span>
            <span className="text-green-600 text-xs ml-1">
              ({validatedUser.email})
            </span>
          </div>
        </div>
      );
    }
    
    if (validationStatus === 'email_not_registered') {
      return (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            This email is not registered in the system. We'll send them a notification anyway.
          </p>
        </div>
      );
    }
    
    if (validationStatus === 'user_not_found') {
      return (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            No user found with this ID. Please check and try again.
          </p>
        </div>
      );
    }
    
    if (validationStatus === 'error') {
      return (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            Error checking recipient. Please try again.
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  // Fetch messages from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    const messagesRef = collection(db, 'messages');
    
    // Create array of possible recipient IDs based on the current user's email
    const possibleRecipientIds = [
      currentUser.uid,
      `email-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '-')}` // For email-based messaging
    ];
    
    // Query messages where either:
    // 1. The user is in the participants array, OR
    // 2. The recipient is a synthetic email ID based on the user's email
    const q = query(
      messagesRef,
      where('participants', 'array-contains-any', possibleRecipientIds),
      orderBy('timestamp', 'desc')
    );
    
    // Set up real-time listener
    let unsubscribe;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 3000; // 3 seconds
    
    const setupListener = () => {
      try {
        // Clear any previous error state
        setError('');
        
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedMessages = [];
          querySnapshot.forEach((doc) => {
            fetchedMessages.push({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate(),
            });
          });
          
          setMessages(fetchedMessages);
          setLoading(false);
          
          // If there are messages and none is selected, select the first one
          if (fetchedMessages.length > 0 && !selectedMessage) {
            setSelectedMessage(fetchedMessages[0]);
          }
          
          // Reset retry count on successful connection
          retryCount = 0;
        }, (error) => {
          console.error("Error fetching messages:", error);
          
          // Check if it's a network-related error
          if (error.code === 'unavailable' || error.message.includes('network') || error.message.includes('jd')) {
            setError("Network issue detected. Messages may not update in real-time.");
            
            // Retry logic for network errors
            if (retryCount < maxRetries && navigator.onLine) {
              retryCount++;
              console.log(`Retrying connection (${retryCount}/${maxRetries}) in ${retryDelay/1000}s...`);
              
              setTimeout(() => {
                if (unsubscribe) {
                  unsubscribe();
                }
                setupListener();
              }, retryDelay);
            } else if (!navigator.onLine) {
              setError("You appear to be offline. Please check your connection.");
              setLoading(false);
            } else {
              setError("Failed to connect after multiple attempts. Please refresh the page.");
              setLoading(false);
            }
          } else {
            setError("Failed to load messages. Please try again later.");
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Error setting up messages listener:", err);
        setError("Failed to initialize messages. Please refresh the page.");
        setLoading(false);
      }
    };
    
    setupListener();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);
  
  // Scroll to bottom of message thread when a new reply is added
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedMessage]);
  
  // Mark message as read when selected
  useEffect(() => {
    if (selectedMessage && !selectedMessage.isRead && selectedMessage.recipient === currentUser.uid) {
      markAsRead(selectedMessage.id);
    }
  }, [selectedMessage, currentUser]);
  
  // Handle selecting a message
  const handleSelectMessage = (message) => {
    // Mark as read when selected
    if (!message.isRead) {
      const updatedMessages = messages.map(m => 
        m.id === message.id ? { ...m, isRead: true } : m
      );
      setMessages(updatedMessages);
    }
    setSelectedMessage(message);
  };
  
  // Mark message as read
  const markAsRead = async (messageId) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        isRead: true
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };
  
  // Toggle star status
  const handleToggleStar = async (messageId) => {
    try {
      const messageToUpdate = messages.find(msg => msg.id === messageId);
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        isStarred: !messageToUpdate.isStarred
      });
    } catch (error) {
      console.error("Error toggling star:", error);
      setError("Failed to update message. Please try again.");
    }
    
    // Update selected message if it's the one being starred/unstarred
    if (selectedMessage && selectedMessage.id === messageId) {
      setSelectedMessage({
        ...selectedMessage,
        isStarred: !selectedMessage.isStarred
      });
    }
  };
  
  // Archive message
  const handleArchive = async (messageId) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        isArchived: !messages.find(msg => msg.id === messageId).isArchived
      });
      
      // Update or clear selected message
      if (selectedMessage && selectedMessage.id === messageId) {
        if (activeFilter !== 'all' && activeFilter !== 'archived') {
          setSelectedMessage(null);
        } else {
          setSelectedMessage({
            ...selectedMessage,
            isArchived: !selectedMessage.isArchived
          });
        }
      }
    } catch (error) {
      console.error("Error archiving message:", error);
      setError("Failed to archive message. Please try again.");
    }
  };
  
  // Delete message
  const handleDelete = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      try {
        const messageRef = doc(db, 'messages', messageId);
        await deleteDoc(messageRef);
        
        // Clear selected message if it's the one being deleted
        if (selectedMessage && selectedMessage.id === messageId) {
          setSelectedMessage(null);
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        setError("Failed to delete message. Please try again.");
      }
    }
  };
  
  // Send reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim() || !selectedMessage) return;
    
    try {
      setSending(true);
      setError('');
      
      // Create a new reply message
      const reply = {
        subject: `Re: ${selectedMessage.subject}`,
        message: replyText.trim(),
        sender: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        senderEmail: currentUser.email,
        recipient: selectedMessage.sender === currentUser.uid ? selectedMessage.recipient : selectedMessage.sender,
        recipientName: selectedMessage.sender === currentUser.uid 
          ? selectedMessage.recipientName 
          : selectedMessage.senderName,
        recipientEmail: selectedMessage.sender === currentUser.uid
          ? selectedMessage.recipientEmail
          : selectedMessage.senderEmail,
        timestamp: Timestamp.now(),
        isRead: false,
        isStarred: false,
        isArchived: false,
        parentMessageId: selectedMessage.id,
        participants: [currentUser.uid, selectedMessage.sender === currentUser.uid ? selectedMessage.recipient : selectedMessage.sender]
      };
      
      await addDoc(collection(db, 'messages'), reply);
      
      setReplyText('');
      setSending(false);
    } catch (error) {
      console.error("Error sending reply:", error);
      setError("Failed to send reply. Please try again.");
      setSending(false);
    }
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    
    const today = new Date();
    const messageDate = new Date(date);
    
    // Check if the message is from today
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if the message is from this year
    if (messageDate.getFullYear() === today.getFullYear()) {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // If the message is from a previous year
    return messageDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Filter messages based on search query and active filter
  const filteredMessages = messages.filter(message => {
    // Search filter
    const matchesSearch = 
      message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    let matchesFilter = true;
    if (activeFilter === 'unread') matchesFilter = !message.isRead;
    else if (activeFilter === 'starred') matchesFilter = message.isStarred;
    else if (activeFilter === 'archived') matchesFilter = message.isArchived;
    
    return matchesSearch && matchesFilter;
  });
  
  // Compose new message
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipient: '',
    subject: '',
    message: '',
  });
  
  // Handle URL query parameters for pre-filling the compose form
  useEffect(() => {
    if (!currentUser) return;
    
    // Check if URL has query parameters for composing a message
    const queryParams = new URLSearchParams(window.location.search);
    const recipient = queryParams.get('recipient');
    const recipientName = queryParams.get('recipientName');
    const subject = queryParams.get('subject');
    
    // If we have query parameters, open the compose modal with pre-filled fields
    if (recipient) {
      setNewMessage({
        recipient: recipient,
        subject: subject || '',
        message: recipientName ? `Hello ${recipientName},\n\n` : '',
      });
      setShowComposeModal(true);
      
      // Clear the query parameters from the URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser]);
  
  const handleComposeChange = (e) => {
    const { name, value } = e.target;
    setNewMessage(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const sendNewMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.recipient.trim() || !newMessage.subject.trim() || !newMessage.message.trim()) {
      setError("Please fill in all fields");
      return;
    }
    
    try {
      setSending(true);
      setError('');
      
      let recipientUid, recipientName, recipientEmail;
      
      // Check if the recipient is an email address
      if (newMessage.recipient.includes('@')) {
        recipientEmail = newMessage.recipient;
        recipientName = recipientEmail.split('@')[0]; // Use part before @ as name
        
        // Create a synthetic ID based on email
        recipientUid = `email-${recipientEmail.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        // Check for existing user with this email
        // This is a sample implementation; in a real app, you'd query your users collection
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', recipientEmail), limit(1));
        const userSnapshot = await getDocs(q);
        
        if (!userSnapshot.empty) {
          // If the user exists, use their actual UID
          const userData = userSnapshot.docs[0].data();
          recipientUid = userSnapshot.docs[0].id;
          recipientName = userData.displayName || recipientName;
        }
      } else {
        // Assume it's a user ID
        recipientUid = newMessage.recipient;
        
        // Try to fetch user info for this ID
        try {
          const userRef = doc(db, 'users', recipientUid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            recipientName = userData.displayName || recipientUid;
            recipientEmail = userData.email || recipientUid;
          } else {
            recipientName = recipientUid;
            recipientEmail = recipientUid;
          }
        } catch (err) {
          console.error("Error fetching recipient info:", err);
          recipientName = recipientUid;
          recipientEmail = recipientUid;
        }
      }
      
      const messageData = {
        subject: newMessage.subject.trim(),
        message: newMessage.message.trim(),
        sender: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        senderEmail: currentUser.email,
        recipient: recipientUid,
        recipientName: recipientName,
        recipientEmail: recipientEmail,
        timestamp: Timestamp.now(),
        isRead: false,
        isStarred: false,
        isArchived: false,
        participants: [currentUser.uid, recipientUid]
      };
      
      // Add message to Firestore
      const docRef = await addDoc(collection(db, 'messages'), messageData);
      
      // Add the message to the local state for immediate display
      const newMessageWithId = {
        id: docRef.id,
        ...messageData,
        timestamp: messageData.timestamp.toDate()
      };
      
      setMessages([newMessageWithId, ...messages]);
      
      // Store notification for recipient
      // This stores a notification that the recipient can check separately
      await addDoc(collection(db, 'notifications'), {
        type: 'new_message',
        messageId: docRef.id,
        recipientId: recipientUid,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        subject: newMessage.subject.trim(),
        timestamp: Timestamp.now(),
        read: false,
        // If it's an email, store the email directly as a backup
        recipientEmail: recipientEmail
      });
      
      // Show success notification
      alert('Message sent successfully!');
      
      setNewMessage({
        recipient: '',
        subject: '',
        message: '',
      });
      setShowComposeModal(false);
      setSending(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setError(`Failed to send message: ${error.message || "Please try again."}`);
      setSending(false);
    }
  };
  
  // Add some sample messages if none exist
  useEffect(() => {
    if (!currentUser) return;
    
    // Only add sample data if no messages exist
    const checkAndAddSampleData = async () => {
      try {
        const messagesRef = collection(db, 'messages');
        const q = query(
          messagesRef,
          where('participants', 'array-contains', currentUser.uid),
          limit(1)
        );
        
        const snapshot = await getDocs(q);
        
        // If no messages exist, add sample data
        if (snapshot.empty) {
          console.log("Adding sample messages");
          
          // Sample users to simulate conversations
          const sampleUsers = [
            { id: 'sample-user-1', name: 'John Doe', email: 'john@example.com' },
            { id: 'sample-user-2', name: 'Sarah Johnson', email: 'sarah@example.com' },
            { id: 'sample-user-3', name: 'Michael Wong', email: 'michael@example.com' },
          ];
          
          // Sample messages
          const sampleMessages = [
            {
              subject: 'Question about your React project',
              message: `Hi there,\n\nI came across your React project on GitHub and I'm interested in contributing. Could you tell me more about the features you're planning to implement?\n\nI have experience with React hooks and context API, and I'd love to work on some frontend components.\n\nLooking forward to your response,\nJohn`,
              sender: sampleUsers[0].id,
              senderName: sampleUsers[0].name,
              senderEmail: sampleUsers[0].email,
              recipient: currentUser.uid,
              recipientName: currentUser.displayName || currentUser.email,
              recipientEmail: currentUser.email,
              timestamp: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
              isRead: false,
              isStarred: false,
              isArchived: false,
              participants: [sampleUsers[0].id, currentUser.uid]
            },
            {
              subject: 'Backend API collaboration opportunity',
              message: `Hello,\n\nI noticed your project needs API integration. I'm a backend developer with experience in Node.js and Express, and I'd be interested in contributing to your open-source project.\n\nI've implemented authentication systems and RESTful APIs for several projects. Let me know if you'd like to discuss this further.\n\nBest regards,\nSarah`,
              sender: sampleUsers[1].id,
              senderName: sampleUsers[1].name,
              senderEmail: sampleUsers[1].email,
              recipient: currentUser.uid,
              recipientName: currentUser.displayName || currentUser.email,
              recipientEmail: currentUser.email,
              timestamp: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
              isRead: true,
              isStarred: true,
              isArchived: false,
              participants: [sampleUsers[1].id, currentUser.uid]
            },
            {
              subject: 'Bug report: login page issue',
              message: `Hello,\n\nI've been testing your application and found an issue with the login page. When using Safari on iOS, the form submission doesn't work correctly.\n\nI'd be happy to fix this bug if you're interested. I can reproduce the issue consistently and have some ideas about what might be causing it.\n\nLet me know how you'd like to proceed.\n\nBest,\nMichael`,
              sender: sampleUsers[2].id,
              senderName: sampleUsers[2].name,
              senderEmail: sampleUsers[2].email,
              recipient: currentUser.uid,
              recipientName: currentUser.displayName || currentUser.email,
              recipientEmail: currentUser.email,
              timestamp: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
              isRead: true,
              isStarred: false,
              isArchived: false,
              participants: [sampleUsers[2].id, currentUser.uid]
            }
          ];
          
          // Add sample messages to Firestore
          for (const message of sampleMessages) {
            await addDoc(collection(db, 'messages'), message);
          }
        }
      } catch (error) {
        console.error("Error adding sample messages:", error);
      }
    };
    
    checkAndAddSampleData();
  }, [currentUser]);
  
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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <button 
            onClick={() => setShowComposeModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          >
            <FaPaperPlane className="mr-2" />
            Compose
          </button>
        </div>
        <p className="text-gray-600">Manage your communications with collaborators</p>
        
        {/* New explanation for collaboration workflow */}
        <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg">
          <h3 className="font-medium mb-2">How to Find Collaborators</h3>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>Go to <Link to="/match-issues" className="text-blue-600 hover:underline">Find Projects</Link> to discover open-source projects that match your skills</li>
            <li>When you find an interesting project, you can message the owner directly</li>
            <li>Alternatively, create your own project and wait for collaborators to contact you</li>
            <li>Use this messaging system to coordinate, share ideas, and plan your contributions</li>
          </ol>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row h-[calc(100vh-200px)]">
        {/* Message List Panel */}
        <div className="w-full md:w-1/3 border-r border-gray-200 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200">
            <button 
              className={`flex-1 py-2 text-sm font-medium ${activeFilter === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium ${activeFilter === 'unread' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveFilter('unread')}
            >
              Unread
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium ${activeFilter === 'starred' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveFilter('starred')}
            >
              Starred
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium ${activeFilter === 'archived' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveFilter('archived')}
            >
              Archived
            </button>
          </div>
          
          {/* Message List */}
          <div className="overflow-y-auto flex-grow">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <FaEnvelope className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-700">No messages found</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery ? 'Try adjusting your search or filters' : 'Your inbox is empty'}
                </p>
              </div>
            ) : (
              filteredMessages.map(message => (
                <div
                  key={message.id}
                  className={`border-b border-gray-200 cursor-pointer transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50' : message.isRead ? 'bg-white' : 'bg-gray-50'
                  }`}
                  onClick={() => handleSelectMessage(message)}
                >
                  <div className="p-3 flex items-start">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center mr-3">
                      {message.avatar ? (
                        <img src={message.avatar} alt={message.sender} className="w-10 h-10 rounded-full" />
                      ) : (
                        <FaUser className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className={`font-medium truncate ${message.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {message.sender === currentUser.uid ? 
                            `Me → ${message.recipientName}` : 
                            message.senderName || message.sender}
                        </h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`truncate text-sm ${message.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                          {message.subject}
                        </p>
                        <div className="flex items-center ml-2">
                          {!message.isRead && (
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                          )}
                          <button
                            className="ml-2 text-gray-400 hover:text-yellow-500 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(message.id);
                            }}
                          >
                            {message.isStarred ? (
                              <FaStar className="text-yellow-400" />
                            ) : (
                              <FaRegStar />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Message Detail Panel */}
        <div className="w-full md:w-2/3 flex flex-col overflow-hidden">
          {selectedMessage ? (
            <>
              {/* Message Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-bold text-gray-800 truncate">{selectedMessage.subject}</h2>
                  <div className="flex space-x-2">
                    <button 
                      className="p-2 text-gray-500 hover:text-yellow-500 focus:outline-none"
                      onClick={() => handleToggleStar(selectedMessage.id)}
                      title={selectedMessage.isStarred ? "Unstar" : "Star"}
                    >
                      {selectedMessage.isStarred ? (
                        <FaStar className="text-yellow-400" />
                      ) : (
                        <FaRegStar />
                      )}
                    </button>
                    <button 
                      className="p-2 text-gray-500 hover:text-blue-600 focus:outline-none"
                      onClick={() => handleArchive(selectedMessage.id)}
                      title={selectedMessage.isArchived ? "Unarchive" : "Archive"}
                    >
                      <FaArchive />
                    </button>
                    <button 
                      className="p-2 text-gray-500 hover:text-red-600 focus:outline-none"
                      onClick={() => handleDelete(selectedMessage.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    {selectedMessage.avatar ? (
                      <img src={selectedMessage.avatar} alt={selectedMessage.sender} className="w-10 h-10 rounded-full" />
                    ) : (
                      <FaUser className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {selectedMessage.sender === currentUser.uid ? 
                        `Me → ${selectedMessage.recipientName}` : 
                        selectedMessage.senderName || selectedMessage.sender}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(selectedMessage.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Message Content */}
              <div className="p-4 overflow-y-auto flex-grow">
                <div className="whitespace-pre-line text-gray-800">
                  {selectedMessage.message}
                </div>
              </div>
              
              {/* Reply Form */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt={currentUser.displayName || "User"} className="w-10 h-10 rounded-full" />
                    ) : (
                      <FaUser className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows="3"
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end mt-2">
                      <button 
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
                        onClick={handleSendReply}
                        disabled={!replyText.trim()}
                      >
                        <FaPaperPlane className="mr-2" />
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <FaEnvelopeOpen className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700">No message selected</h3>
              <p className="text-gray-500 mt-2 max-w-md">
                Select a message from the list to view its contents
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">New Message</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
                {error}
              </div>
            )}
            
            <form onSubmit={sendNewMessage}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To:
                </label>
                <input
                  type="text"
                  name="recipient"
                  value={newMessage.recipient}
                  onChange={handleComposeChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the user ID or email of the person you want to message.
                </p>
              </div>
              
              {/* User validation feedback - show when typing */}
              {newMessage.recipient && (
                <div className="mb-4">
                  <ValidateRecipient recipient={newMessage.recipient} />
                </div>
              )}
              
              {/* New section to help find collaborators */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Looking for collaborators?</h4>
                <p className="text-sm text-gray-600 mb-2">
                  You can find potential collaborators in the following ways:
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  <li>View project owners on the <Link to="/match-issues" className="text-blue-600 hover:underline">Find Projects</Link> page</li>
                  <li>Add your project to our platform to attract interested contributors</li>
                  <li>Share your contact information in your profile to make it easier for others to find you</li>
                </ul>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject:
                </label>
                <input
                  type="text"
                  name="subject"
                  value={newMessage.subject}
                  onChange={handleComposeChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message:
                </label>
                <textarea
                  name="message"
                  value={newMessage.message}
                  onChange={handleComposeChange}
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                ></textarea>
                
                {/* Message templates */}
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Message Templates:</p>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      type="button"
                      onClick={() => setNewMessage({
                        ...newMessage,
                        subject: "Interested in contributing to your project",
                        message: "Hi there,\n\nI'm interested in contributing to your project. I have experience with [your skills] and would like to help with [specific area or issue].\n\nPlease let me know if you're looking for contributors and how I might be able to help.\n\nBest regards,\n" + (currentUser?.displayName || "")
                      })}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                    >
                      Project Contribution
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewMessage({
                        ...newMessage,
                        subject: "Question about your open-source project",
                        message: "Hello,\n\nI have a question about your project. [Ask your specific question here]\n\nThanks for your time!\n\n" + (currentUser?.displayName || "")
                      })}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                    >
                      Ask a Question
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewMessage({
                        ...newMessage,
                        subject: "Collaboration opportunity",
                        message: "Hi,\n\nI'm working on a project that's similar to yours, and I think there might be an opportunity for us to collaborate. My project is [brief description of your project].\n\nWould you be interested in discussing potential ways we could work together?\n\nRegards,\n" + (currentUser?.displayName || "")
                      })}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                    >
                      Collaboration
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center"
                >
                  {sending ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages; 