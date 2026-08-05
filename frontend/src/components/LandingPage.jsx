import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
    FaRobot,
    FaCalendarCheck,
    FaBookOpen,
    FaChartLine,
    FaClock,
    FaBrain,
    FaGraduationCap,
    FaTasks,
    FaUniversity,
    FaArrowRight,
    FaCheckCircle,
    FaLightbulb,
    FaBullseye,
    FaTrophy,
    FaSun,
    FaMoon
} from 'react-icons/fa';

const LandingPage = () => {
    const { currentUser, userRole } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('tools');
    const [theme, setTheme] = useState('dark'); // 'dark' or 'light'

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('authTheme') || 'dark';
        setTheme(savedTheme);
    }, []);

    // Toggle theme and save to localStorage
    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('authTheme', newTheme);
    };

    // Redirect if already logged in
    useEffect(() => {
        if (currentUser && userRole) {
            if (userRole === 'student') {
                navigate('/student/dashboard');
            } else if (userRole === 'college_admin') {
                navigate('/college/dashboard');
            }
        }
    }, [currentUser, userRole, navigate]);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const isDark = theme === 'dark';

    return (
        <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-500 ${isDark ? 'bg-black/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <FaBrain className="text-purple-500 text-2xl" />
                            <span className={`text-xl font-bold transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>Momentum</span>
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <button onClick={() => scrollToSection('home')} className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>
                                Home
                            </button>
                            <button onClick={() => scrollToSection('about')} className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>
                                About
                            </button>
                            <button onClick={() => scrollToSection('services')} className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>
                                Services
                            </button>
                            <button onClick={() => scrollToSection('features')} className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>
                                Features
                            </button>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-lg transition-all duration-300 ${isDark
                                    ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                aria-label="Toggle theme"
                            >
                                {isDark ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
                            </button>

                            <Link
                                to="/login"
                                className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors text-white"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="home" className="relative min-h-screen flex items-center pt-16 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-6"
                        >
                            <h1 className={`text-5xl md:text-6xl font-bold leading-tight transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>
                                Build Study <span className="text-purple-500">Momentum</span> Daily
                            </h1>
                            <p className={`text-xl transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                An AI-powered productivity platform designed for students. Track tasks, manage time,
                                and achieve your academic goals with personalized insights and smart scheduling.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to="/register"
                                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                                >
                                    <span>Get Started</span>
                                    <FaArrowRight />
                                </Link>
                                <button
                                    onClick={() => scrollToSection('about')}
                                    className={`px-8 py-3 border rounded-lg font-medium transition-colors ${isDark ? 'border-gray-700 hover:border-purple-500' : 'border-gray-300 hover:border-purple-600'}`}
                                >
                                    Learn More
                                </button>
                            </div>
                            <div className={`flex items-center space-x-6 text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <div className="flex items-center space-x-2">
                                    <FaCheckCircle className="text-green-500" />
                                    <span>Free to use</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FaCheckCircle className="text-green-500" />
                                    <span>AI-powered</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FaCheckCircle className="text-green-500" />
                                    <span>Privacy focused</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right - Brain Animation */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="relative w-full aspect-square max-w-lg mx-auto">
                                {/* Brain Image */}
                                <motion.div
                                    animate={{ y: [0, -20, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative z-10"
                                >
                                    <img
                                        src="/images/brain.png"
                                        alt="Brain visualization"
                                        className="w-full h-full object-contain drop-shadow-2xl"
                                    />
                                </motion.div>

                                {/* Neon Glow */}
                                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full"></div>

                                {/* Stars */}
                                {[
                                    { top: '20%', left: '10%' },
                                    { top: '15%', left: '80%' },
                                    { top: '60%', left: '85%' },
                                    { top: '75%', left: '30%' },
                                    { top: '40%', left: '50%' },
                                    { top: '30%', left: '20%' },
                                    { top: '80%', left: '70%' },
                                    { top: '50%', left: '15%' }
                                ].map((pos, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 bg-white rounded-full"
                                        style={pos}
                                        animate={{
                                            opacity: [0.2, 1, 0.2],
                                            scale: [0.8, 1.2, 0.8]
                                        }}
                                        transition={{
                                            duration: 2 + i * 0.3,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}

                                {/* Neural Lines */}
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute bg-gradient-to-r from-transparent via-purple-500 to-transparent h-px"
                                        style={{
                                            top: `${20 + i * 15}%`,
                                            left: '10%',
                                            right: '10%',
                                            transform: `rotate(${i * 30}deg)`,
                                            transformOrigin: 'center'
                                        }}
                                        animate={{
                                            opacity: [0.1, 0.5, 0.1]
                                        }}
                                        transition={{
                                            duration: 3 + i * 0.5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}

                                {/* Pulse Circles */}
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute inset-0 border-2 border-purple-500/30 rounded-full"
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [0.5, 0, 0.5]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            delay: i * 1,
                                            ease: "easeOut"
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className={`py-20 transition-colors duration-500 ${isDark ? 'bg-gradient-to-b from-black to-gray-900' : 'bg-gradient-to-b from-white to-gray-50'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className={`text-4xl font-bold mb-4 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>About Momentum</h2>
                        <div className="w-20 h-1 bg-purple-500 mx-auto"></div>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="space-y-6"
                        >
                            <h3 className={`text-3xl font-bold transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>Empowering Student Productivity</h3>
                            <p className={`transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Momentum is a comprehensive productivity platform dedicated to supporting students across
                                their academic journey. Founded in 2021, we bridge the gap between students facing
                                productivity challenges and effective time management systems.
                            </p>
                            <p className={`transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Our mission is to create a distraction-free environment where every student can access
                                quality productivity tools, AI mentorship, and habit tracking. We believe that consistent
                                progress is essential for academic success and personal growth.
                            </p>

                            {/* Key Stats */}
                            <div className="grid grid-cols-2 gap-4 pt-6">
                                <div className={`p-6 rounded-lg border transition-colors duration-500 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                    <FaClock className="text-purple-500 text-3xl mb-2" />
                                    <h4 className={`text-2xl font-bold transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>10K+</h4>
                                    <p className={`text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Study Sessions</p>
                                </div>
                                <div className={`p-6 rounded-lg border transition-colors duration-500 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                    <FaGraduationCap className="text-purple-500 text-3xl mb-2" />
                                    <h4 className={`text-2xl font-bold transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>200+</h4>
                                    <p className={`text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Students</p>
                                </div>
                                <div className={`p-6 rounded-lg border transition-colors duration-500 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                    <FaTasks className="text-purple-500 text-3xl mb-2" />
                                    <h4 className={`text-2xl font-bold transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>500+</h4>
                                    <p className={`text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tasks Completed</p>
                                </div>
                                <div className={`p-6 rounded-lg border transition-colors duration-500 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                    <FaUniversity className="text-purple-500 text-3xl mb-2" />
                                    <h4 className={`text-2xl font-bold transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>28</h4>
                                    <p className={`text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Institutions</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Image */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative"
                        >
                            <div className="relative rounded-2xl overflow-hidden">
                                <img
                                    src="/images/class.png"
                                    alt="Student studying"
                                    className="w-full h-auto rounded-2xl"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            </div>
                            <div className="absolute -bottom-6 -right-6 bg-purple-600 rounded-2xl p-6 shadow-2xl text-white">
                                <div className="text-4xl font-bold">3+</div>
                                <div className="text-sm">Years of<br />Experience</div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className={`py-20 transition-colors duration-500 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className={`text-4xl font-bold mb-4 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>Our Services</h2>
                        <div className="w-20 h-1 bg-purple-500 mx-auto"></div>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <FaRobot className="text-4xl" />,
                                title: 'AI Study Mentor',
                                description: 'Get personalized study plans, motivation, and academic guidance powered by AI.',
                                link: '/student/mentor'
                            },
                            {
                                icon: <FaCalendarCheck className="text-4xl" />,
                                title: 'Smart Scheduling',
                                description: 'Intelligent task management with deadline tracking and priority optimization.',
                                link: '/student/planner'
                            },
                            {
                                icon: <FaClock className="text-4xl" />,
                                title: 'Focus Sessions',
                                description: 'Pomodoro timer with analytics to maximize your concentration and productivity.',
                                link: '/student/focus'
                            },
                            {
                                icon: <FaChartLine className="text-4xl" />,
                                title: 'Progress Analytics',
                                description: 'Track your productivity patterns and visualize your academic progress.',
                                link: '/student/analytics'
                            }
                        ].map((service, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className={`p-8 rounded-2xl border hover:border-purple-500 transition-all duration-300 group ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
                            >
                                <div className="text-purple-500 mb-4 group-hover:scale-110 transition-transform">
                                    {service.icon}
                                </div>
                                <h3 className={`text-xl font-bold mb-3 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>{service.title}</h3>
                                <p className={`mb-4 transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{service.description}</p>
                                <Link
                                    to={service.link}
                                    className={`inline-flex items-center space-x-2 text-sm font-medium transition-colors duration-300 ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}
                                >
                                    <span>Try Now</span>
                                    <FaArrowRight />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className={`py-20 transition-colors duration-500 ${isDark ? 'bg-black' : 'bg-white'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className={`text-4xl font-bold mb-4 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>Explore Features</h2>
                        <p className={`max-w-2xl mx-auto transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Discover powerful tools designed to boost your productivity and help you achieve your academic goals.
                        </p>
                    </motion.div>

                    {/* Tabs */}
                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {[
                            { id: 'tools', label: 'Study Tools', icon: <FaBookOpen /> },
                            { id: 'ai', label: 'AI Features', icon: <FaBrain /> },
                            { id: 'analytics', label: 'Analytics', icon: <FaChartLine /> },
                            { id: 'habits', label: 'Habit Tracking', icon: <FaBullseye /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${activeTab === tab.id
                                    ? 'bg-purple-600 text-white'
                                    : isDark
                                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        {activeTab === 'tools' && (
                            <>
                                <FeatureCard
                                    icon={<FaTasks />}
                                    title="Task Management"
                                    description="Organize your assignments, projects, and deadlines in one place with smart prioritization."
                                    isDark={isDark}
                                />
                                <FeatureCard
                                    icon={<FaClock />}
                                    title="Pomodoro Timer"
                                    description="Stay focused with customizable work sessions and break intervals."
                                    isDark={isDark}
                                />
                                <FeatureCard
                                    icon={<FaCalendarCheck />}
                                    title="Smart Planner"
                                    description="Plan your week with AI-suggested time blocks and study schedules."
                                    isDark={isDark}
                                />
                            </>
                        )}
                        {activeTab === 'ai' && (
                            <>
                                <FeatureCard
                                    icon={<FaRobot />}
                                    title="AI Mentor"
                                    description="Get personalized study advice and motivation from your AI study companion."
                                    isDark={isDark}
                                />
                                <FeatureCard
                                    icon={<FaLightbulb />}
                                    title="Smart Suggestions"
                                    description="Receive intelligent recommendations based on your study patterns."
                                    isDark={isDark}
                                />
                                <FeatureCard
                                    icon={<FaBrain />}
                                    title="Learning Insights"
                                    description="Understand your learning style with AI-powered analysis."
                                    isDark={isDark}
                                />
                            </>
                        )}
                        {activeTab === 'analytics' && (
                            <>
                                <FeatureCard
                                    icon={<FaChartLine />}
                                    title="Progress Tracking"
                                    description="Visualize your productivity trends with detailed charts and graphs."
                                    isDark={isDark}
                                />
                                <FeatureCard
                                    icon={<FaTrophy />}
                                    title="Achievement System"
                                    description="Earn badges and track milestones as you build momentum."
                                    isDark={isDark}
                                />
                                <FeatureCard
                                    icon={<FaBullseye />}
                                    title="Goal Setting"
                                    description="Set and track academic goals with measurable outcomes."
                                    isDark={isDark}
                                />
                            </>
                        )}
                        {activeTab === 'habits' && (
                            <>
                                <FeatureCard
                                    icon={<FaCheckCircle />}
                                    title="Daily Habits"
                                    description="Build consistent study habits with daily tracking and reminders."
                                    isDark={isDark}
                                />
                                <FeatureCard
                                    icon={<FaTrophy />}
                                    title="Streak Counter"
                                    description="Maintain your momentum with visual streak tracking."
                                    isDark={isDark}
                                />
                                <FeatureCard
                                    icon={<FaBullseye />}
                                    title="Custom Goals"
                                    description="Create personalized habit goals tailored to your needs."
                                    isDark={isDark}
                                />
                            </>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Statistics Section */}
            <section id="statistics" className={`py-20 transition-colors duration-500 ${isDark ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-gradient-to-b from-gray-100 to-gray-50'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className={`text-4xl font-bold mb-4 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>Student Productivity Impact</h2>
                        <p className={`max-w-2xl mx-auto transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            See how Momentum is helping students achieve their academic goals and build better study habits.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <FaGraduationCap />,
                                value: '85%',
                                label: 'Improved Grades',
                                description: 'Students report better academic performance'
                            },
                            {
                                icon: <FaClock />,
                                value: '3.5hrs',
                                label: 'Daily Focus Time',
                                description: 'Average productive study hours'
                            },
                            {
                                icon: <FaTrophy />,
                                value: '92%',
                                label: 'Goal Achievement',
                                description: 'Students meeting their targets'
                            },
                            {
                                icon: <FaBullseye />,
                                value: '15+',
                                label: 'Day Streak',
                                description: 'Average consistency streak'
                            }
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className={`p-8 rounded-2xl border text-center transition-colors duration-500 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
                            >
                                <div className="text-purple-500 text-4xl mb-4 flex justify-center">
                                    {stat.icon}
                                </div>
                                <div className={`text-4xl font-bold mb-2 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>{stat.value}</div>
                                <div className={`text-xl font-semibold mb-2 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>{stat.label}</div>
                                <p className={`text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className={`border-t py-12 transition-colors duration-500 ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <FaBrain className="text-purple-500 text-2xl" />
                                <span className={`text-xl font-bold transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>Momentum</span>
                            </div>
                            <p className={`text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Empowering students to build consistent study habits and achieve academic excellence.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className={`font-semibold mb-4 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>Quick Links</h4>
                            <ul className={`space-y-2 text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <li><button onClick={() => scrollToSection('home')} className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>Home</button></li>
                                <li><button onClick={() => scrollToSection('about')} className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>About</button></li>
                                <li><button onClick={() => scrollToSection('services')} className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>Services</button></li>
                                <li><button onClick={() => scrollToSection('features')} className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>Features</button></li>
                            </ul>
                        </div>

                        {/* Services */}
                        <div>
                            <h4 className={`font-semibold mb-4 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>Services</h4>
                            <ul className={`space-y-2 text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <li><Link to="/student/mentor" className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>AI Mentor</Link></li>
                                <li><Link to="/student/tasks" className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>Task Management</Link></li>
                                <li><Link to="/student/focus" className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>Focus Sessions</Link></li>
                                <li><Link to="/student/analytics" className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>Analytics</Link></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className={`font-semibold mb-4 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>Get Started</h4>
                            <ul className={`space-y-2 text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <li><Link to="/register" className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>Sign Up</Link></li>
                                <li><Link to="/login" className={`transition-colors duration-300 ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}>Sign In</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className={`border-t pt-8 text-center text-sm transition-colors duration-500 ${isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                        <p>&copy; {new Date().getFullYear()} Momentum. All rights reserved. Built for students, by students.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description, isDark }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className={`p-6 rounded-xl border hover:border-purple-500 transition-all duration-300 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
    >
        <div className="text-purple-500 text-3xl mb-4">{icon}</div>
        <h3 className={`text-lg font-bold mb-2 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>{title}</h3>
        <p className={`text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
    </motion.div>
);

export default LandingPage;