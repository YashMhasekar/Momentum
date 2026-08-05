// ═══════════════════════════════════════════════════════════════════════════
// MOCK COUNSELOR DATA - For UI Development Only
// ═══════════════════════════════════════════════════════════════════════════

export const counselorCategories = [
    {
        id: 'mental-wellness',
        title: 'Mental Wellness',
        description: 'Support for anxiety, stress, and emotional well-being',
        icon: '🧠',
        color: 'from-blue-500 to-cyan-500',
        availableCount: 8
    },
    {
        id: 'academic-counseling',
        title: 'Academic Counseling',
        description: 'Guidance for study strategies and academic challenges',
        icon: '📚',
        color: 'from-purple-500 to-pink-500',
        availableCount: 6
    },
    {
        id: 'burnout-recovery',
        title: 'Burnout Recovery',
        description: 'Help with exhaustion and motivation issues',
        icon: '🔥',
        color: 'from-orange-500 to-red-500',
        availableCount: 5
    },
    {
        id: 'stress-management',
        title: 'Stress Management',
        description: 'Techniques to cope with daily pressures',
        icon: '🌿',
        color: 'from-green-500 to-teal-500',
        availableCount: 7
    },
    {
        id: 'career-guidance',
        title: 'Career Guidance',
        description: 'Career planning and professional development',
        icon: '🎯',
        color: 'from-indigo-500 to-blue-500',
        availableCount: 4
    },
    {
        id: 'peer-support',
        title: 'Peer Support',
        description: 'Connect with trained peer counselors',
        icon: '🤝',
        color: 'from-pink-500 to-rose-500',
        availableCount: 10
    }
];

export const counselors = [
    {
        id: 'c1',
        name: 'Dr. Sarah Mitchell',
        title: 'Clinical Psychologist',
        specialization: 'Mental Wellness & Anxiety',
        experience: 12,
        rating: 4.9,
        reviewCount: 156,
        languages: ['English', 'Spanish'],
        photoURL: '/person_icon.jpg',
        availability: 'Available Today',
        availabilityStatus: 'available',
        categories: ['mental-wellness', 'stress-management'],
        sessionModes: ['Video Call', 'Audio Call', 'Chat Session'],
        bio: 'Dr. Sarah Mitchell is a licensed clinical psychologist with over 12 years of experience helping students navigate anxiety, stress, and emotional challenges. She specializes in cognitive behavioral therapy and mindfulness-based approaches.',
        expertise: [
            'Anxiety & Depression',
            'Stress Management',
            'Mindfulness Techniques',
            'Cognitive Behavioral Therapy',
            'Student Mental Health'
        ],
        sessionTimings: 'Mon-Fri: 9:00 AM - 6:00 PM',
        communicationStyle: 'Empathetic and solution-focused',
        reviews: [
            {
                student: 'Anonymous',
                rating: 5,
                comment: 'Dr. Mitchell helped me overcome my exam anxiety. Highly recommended!'
            },
            {
                student: 'Anonymous',
                rating: 5,
                comment: 'Very understanding and professional. I feel much better after our sessions.'
            }
        ]
    },
    {
        id: 'c2',
        name: 'Prof. James Anderson',
        title: 'Academic Counselor',
        specialization: 'Study Skills & Time Management',
        experience: 8,
        rating: 4.8,
        reviewCount: 98,
        languages: ['English'],
        photoURL: '/person_icon.jpg',
        availability: 'Available Tomorrow',
        availabilityStatus: 'busy',
        categories: ['academic-counseling', 'stress-management'],
        sessionModes: ['Video Call', 'In-Person'],
        bio: 'Professor Anderson has dedicated his career to helping students achieve academic excellence through effective study strategies and time management techniques.',
        expertise: [
            'Study Strategies',
            'Time Management',
            'Exam Preparation',
            'Academic Planning',
            'Learning Techniques'
        ],
        sessionTimings: 'Mon-Sat: 10:00 AM - 5:00 PM',
        communicationStyle: 'Structured and motivational',
        reviews: [
            {
                student: 'Anonymous',
                rating: 5,
                comment: 'His study techniques transformed my grades!'
            }
        ]
    },
    {
        id: 'c3',
        name: 'Dr. Priya Sharma',
        title: 'Wellness Coach',
        specialization: 'Burnout & Work-Life Balance',
        experience: 10,
        rating: 4.9,
        reviewCount: 142,
        languages: ['English', 'Hindi'],
        photoURL: '/person_icon.jpg',
        availability: 'Available Today',
        availabilityStatus: 'available',
        categories: ['burnout-recovery', 'mental-wellness', 'stress-management'],
        sessionModes: ['Video Call', 'Audio Call', 'Chat Session', 'In-Person'],
        bio: 'Dr. Sharma specializes in helping students recover from burnout and establish healthy work-life balance. Her holistic approach combines mental wellness with practical lifestyle changes.',
        expertise: [
            'Burnout Recovery',
            'Work-Life Balance',
            'Self-Care Strategies',
            'Energy Management',
            'Holistic Wellness'
        ],
        sessionTimings: 'Mon-Sun: 8:00 AM - 8:00 PM',
        communicationStyle: 'Warm and holistic',
        reviews: [
            {
                student: 'Anonymous',
                rating: 5,
                comment: 'Dr. Sharma helped me find balance again. Forever grateful!'
            }
        ]
    },
    {
        id: 'c4',
        name: 'Michael Chen',
        title: 'Career Counselor',
        specialization: 'Career Planning & Development',
        experience: 6,
        rating: 4.7,
        reviewCount: 76,
        languages: ['English', 'Mandarin'],
        photoURL: '/person_icon.jpg',
        availability: 'Available This Week',
        availabilityStatus: 'available',
        categories: ['career-guidance'],
        sessionModes: ['Video Call', 'In-Person'],
        bio: 'Michael Chen helps students navigate career decisions and professional development with practical insights from his industry experience.',
        expertise: [
            'Career Planning',
            'Resume Building',
            'Interview Preparation',
            'Industry Insights',
            'Professional Development'
        ],
        sessionTimings: 'Tue-Sat: 11:00 AM - 7:00 PM',
        communicationStyle: 'Practical and encouraging',
        reviews: [
            {
                student: 'Anonymous',
                rating: 5,
                comment: 'Great career advice and actionable steps!'
            }
        ]
    },
    {
        id: 'c5',
        name: 'Emma Rodriguez',
        title: 'Peer Support Coordinator',
        specialization: 'Student Peer Counseling',
        experience: 3,
        rating: 4.8,
        reviewCount: 89,
        languages: ['English', 'Spanish'],
        photoURL: '/person_icon.jpg',
        availability: 'Available Today',
        availabilityStatus: 'available',
        categories: ['peer-support', 'stress-management'],
        sessionModes: ['Video Call', 'Audio Call', 'Chat Session'],
        bio: 'Emma is a trained peer counselor who understands student challenges firsthand. She provides relatable support and practical coping strategies.',
        expertise: [
            'Peer Support',
            'Active Listening',
            'Stress Coping',
            'Student Life Balance',
            'Emotional Support'
        ],
        sessionTimings: 'Mon-Fri: 2:00 PM - 10:00 PM',
        communicationStyle: 'Friendly and relatable',
        reviews: [
            {
                student: 'Anonymous',
                rating: 5,
                comment: 'Emma really gets what students go through. Very helpful!'
            }
        ]
    },
    {
        id: 'c6',
        name: 'Dr. Robert Williams',
        title: 'Clinical Therapist',
        specialization: 'Depression & Anxiety',
        experience: 15,
        rating: 4.9,
        reviewCount: 203,
        languages: ['English'],
        photoURL: '/person_icon.jpg',
        availability: 'Available Tomorrow',
        availabilityStatus: 'busy',
        categories: ['mental-wellness'],
        sessionModes: ['Video Call', 'In-Person'],
        bio: 'Dr. Williams is a highly experienced clinical therapist specializing in depression and anxiety disorders among young adults and students.',
        expertise: [
            'Depression Treatment',
            'Anxiety Disorders',
            'Trauma Recovery',
            'Emotional Regulation',
            'Therapeutic Counseling'
        ],
        sessionTimings: 'Mon-Thu: 9:00 AM - 5:00 PM',
        communicationStyle: 'Professional and compassionate',
        reviews: [
            {
                student: 'Anonymous',
                rating: 5,
                comment: 'Life-changing sessions. Dr. Williams is exceptional.'
            }
        ]
    }
];

export const timeSlots = [
    { time: '09:00 AM', available: true },
    { time: '10:00 AM', available: true },
    { time: '11:00 AM', available: false },
    { time: '11:30 AM', available: true },
    { time: '01:00 PM', available: true },
    { time: '02:00 PM', available: true },
    { time: '03:00 PM', available: false },
    { time: '04:00 PM', available: true },
    { time: '05:00 PM', available: true },
    { time: '05:30 PM', available: true }
];

export const mockWellnessData = {
    stressLevel: 'Mild',
    stressScore: 35,
    mood: 'Stable',
    moodScore: 72,
    wellnessScore: 78,
    focusStatus: 'Good',
    focusScore: 82
};

export const mockUpcomingBookings = [
    {
        id: 'b1',
        counselor: 'Dr. Sarah Mitchell',
        counselorTitle: 'Clinical Psychologist',
        date: '2026-05-10',
        time: '10:00 AM',
        duration: '45 min',
        mode: 'Video Call',
        status: 'confirmed',
        concern: 'Exam anxiety management'
    },
    {
        id: 'b2',
        counselor: 'Prof. James Anderson',
        counselorTitle: 'Academic Counselor',
        date: '2026-05-12',
        time: '02:00 PM',
        duration: '60 min',
        mode: 'In-Person',
        status: 'pending',
        concern: 'Study strategy improvement'
    }
];
