import React, { useState } from 'react';
import { searchVideos, searchLectures } from '../../utils/youtubeApi';
import InputSection from '../focused_yt/InputSection';
import TabNavigation from '../focused_yt/TabNavigation';
import ReelsContainer from '../focused_yt/ReelsContainer';
import LecturesGrid from '../focused_yt/LecturesGrid';
import EmptyState from '../focused_yt/EmptyState';
import LoadingSpinner from '../focused_yt/LoadingSpinner';
import './StudyReels.css';

function StudyReels() {
    const [activeTab, setActiveTab] = useState('shorts');
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showContent, setShowContent] = useState(false);

    const handleLoadContent = async (topic) => {
        setLoading(true);
        try {
            let results;
            if (activeTab === 'shorts') {
                results = await searchVideos(topic);
            } else {
                results = await searchLectures(topic);
            }

            setVideos(results);
            setShowContent(true);
        } catch (error) {
            console.error('Error loading content:', error);
            setVideos([]);
            setShowContent(true);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setShowContent(false);
        setVideos([]);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setShowContent(false);
        setVideos([]);
    };

    // Loading state
    if (loading) {
        return <LoadingSpinner />;
    }

    // Show content if loaded
    if (showContent) {
        // Empty state
        if (videos.length === 0) {
            return <EmptyState onBack={handleBack} />;
        }

        // Show reels or lectures based on active tab
        if (activeTab === 'shorts') {
            return <ReelsContainer videos={videos} onBack={handleBack} />;
        } else {
            return <LecturesGrid videos={videos} onBack={handleBack} />;
        }
    }

    // Initial state - show input section with tab navigation
    return (
        <div className="study-reels-container">
            <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
            <InputSection
                onLoadContent={handleLoadContent}
                loading={loading}
                contentType={activeTab}
            />
        </div>
    );
}

export default StudyReels;
