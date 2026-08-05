import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarCheck, FaSearch, FaFilter, FaHeart } from 'react-icons/fa';
import WellnessStatusCards from '../../components/student/counselor/WellnessCard';
import CategoryCard from '../../components/student/counselor/CategoryCard';
import CounselorCard from '../../components/student/counselor/CounselorCard';
import CounselorProfileModal from '../../components/student/counselor/CounselorProfileModal';
import BookingModal from '../../components/student/counselor/BookingModal';
import BookingTimeline from '../../components/student/counselor/BookingTimeline';
import EmergencySupport from '../../components/student/counselor/EmergencySupport';
import {
    counselorCategories,
    counselors,
    mockWellnessData,
    mockUpcomingBookings
} from '../../data/counselorsData';

export default function CounselorBooking() {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCounselor, setSelectedCounselor] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [upcomingBookings, setUpcomingBookings] = useState(mockUpcomingBookings);

    // Filter counselors based on category and search
    const filteredCounselors = counselors.filter((counselor) => {
        const matchesCategory = !selectedCategory || counselor.categories.includes(selectedCategory);
        const matchesSearch =
            !searchQuery ||
            counselor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            counselor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleViewProfile = (counselor) => {
        setSelectedCounselor(counselor);
        setShowProfileModal(true);
    };

    const handleBookSession = (counselor) => {
        setSelectedCounselor(counselor);
        setShowBookingModal(true);
    };

    const handleConfirmBooking = (bookingData) => {
        // Add new booking to the list (UI only)
        const newBooking = {
            id: `b${upcomingBookings.length + 1}`,
            counselor: bookingData.counselor,
            counselorTitle: selectedCounselor.title,
            date: bookingData.date,
            time: bookingData.timeSlot,
            duration: '45 min',
            mode: bookingData.sessionMode,
            status: 'pending',
            concern: bookingData.concern
        };
        setUpcomingBookings([...upcomingBookings, newBooking]);

        // Show success message (UI only)
        alert('Booking confirmed! You will receive a confirmation email shortly.');
    };

    const handleReschedule = (booking) => {
        // UI only
        alert(`Reschedule booking for ${booking.counselor} - Feature coming soon`);
    };

    const handleCancel = (booking) => {
        // UI only
        if (window.confirm(`Are you sure you want to cancel your session with ${booking.counselor}?`)) {
            setUpcomingBookings(upcomingBookings.filter((b) => b.id !== booking.id));
            alert('Booking cancelled successfully');
        }
    };

    const handleJoin = (booking) => {
        // UI only
        alert(`Joining session with ${booking.counselor} - Feature coming soon`);
    };

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <div className="inline-block mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <FaHeart className="text-4xl text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                        Talk to Someone Who Understands
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                        Book confidential wellness and academic support sessions with certified counselors and mentors.
                        Your mental health matters, and we're here to support you every step of the way.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => scrollToSection('counselors')}
                            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                        >
                            <FaCalendarCheck className="inline mr-2" />
                            Book Session
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => scrollToSection('categories')}
                            className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-200"
                        >
                            <FaSearch className="inline mr-2" />
                            Find Counselor
                        </motion.button>
                    </div>
                </motion.div>

                {/* Wellness Status Cards */}
                <WellnessStatusCards wellnessData={mockWellnessData} />

                {/* Emergency Support Section */}
                <div className="mb-12">
                    <EmergencySupport />
                </div>

                {/* Upcoming Bookings */}
                {upcomingBookings.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Upcoming Sessions</h2>
                        <BookingTimeline
                            bookings={upcomingBookings}
                            onReschedule={handleReschedule}
                            onCancel={handleCancel}
                            onJoin={handleJoin}
                        />
                    </motion.div>
                )}

                {/* Category Section */}
                <motion.div
                    id="categories"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Counseling Categories</h2>
                        {selectedCategory && (
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-xl transition-colors"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {counselorCategories.map((category) => (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                onClick={() => {
                                    setSelectedCategory(category.id);
                                    scrollToSection('counselors');
                                }}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Counselors Section */}
                <motion.div
                    id="counselors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="mb-6">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
                            <h2 className="text-3xl font-bold text-gray-900">
                                {selectedCategory ? 'Filtered Counselors' : 'Available Counselors'}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaFilter />
                                <span>{filteredCounselors.length} counselors available</span>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or specialization..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Counselor Cards Grid */}
                    {filteredCounselors.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCounselors.map((counselor) => (
                                <CounselorCard
                                    key={counselor.id}
                                    counselor={counselor}
                                    onViewProfile={handleViewProfile}
                                    onBookSession={handleBookSession}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaSearch className="text-3xl text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Counselors Found</h3>
                            <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory(null);
                                }}
                                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Support Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 bg-white rounded-3xl border border-gray-200 shadow-sm"
                >
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Remember, You're Not Alone
                    </h3>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Taking the step to seek support is a sign of strength. Our counselors are here to provide
                        a safe, confidential space where you can share your concerns and work towards your well-being.
                    </p>
                </motion.div>
            </div>

            {/* Modals */}
            <CounselorProfileModal
                counselor={selectedCounselor}
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                onBookSession={handleBookSession}
            />

            <BookingModal
                counselor={selectedCounselor}
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                onConfirm={handleConfirmBooking}
            />
        </div>
    );
}
