"use client"

import React, { useState } from 'react';
import { Play, Flame, Volume2, ArrowRight, CheckCircle2, MapPin, X } from 'lucide-react';

interface Event {
    id: string;
    title: string;
    scripture: string;
    date: string;
    time: string;
    isLive: boolean;
    image: string;
    latitude: number;
    longitude: number;
}

interface Story {
    id: string;
    title: string;
    thumbnail: string;
    isUnseen: boolean;
}

interface FeedItem {
    id: string;
    type: 'ANNOUNCEMENT' | 'BLOG';
    category: string;
    title: string;
    snippet: string;
    date: string;
    readTime?: string;
}

const CHECK_IN_RADIUS_METERS = 500;

const UPCOMING_EVENT: Event = {
    id: 'evt-1',
    title: 'Who Is Your King?',
    scripture: 'Esther 3-7',
    date: '3 Aug',
    time: '7:30 – 9:00 am',
    isLive: true,
    image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    latitude: 6.544021266993685,
    longitude: 3.381137900558612
};

const STORIES: Story[] = [
    { id: 'st-1', title: 'Worship Highlights', thumbnail: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=150&auto=format&fit=crop', isUnseen: true },
    { id: 'st-2', title: 'Youth Night Clip', thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=150&auto=format&fit=crop', isUnseen: true },
    { id: 'st-3', title: 'Sunday Sermon Recap', thumbnail: 'https://images.unsplash.com/photo-1445108771252-d1cc31a02a3c?q=80&w=150&auto=format&fit=crop', isUnseen: false },
    { id: 'st-4', title: 'Choir Rehearsal', thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=150&auto=format&fit=crop', isUnseen: false },
];

const FEED_ITEMS: FeedItem[] = [
    {
        id: 'feed-1',
        type: 'ANNOUNCEMENT',
        category: 'Community',
        title: 'Justice For The Poor: Midweek Outreach Initiatives',
        snippet: 'Join us this Thursday as we partner with local food distribution networks to provide resource parcels to underprivileged families in our neighborhood.',
        date: 'Today'
    },
    {
        id: 'feed-2',
        type: 'BLOG',
        category: 'Spiritual Growth',
        title: 'Finding Relief From Your Spiritual Enemies',
        snippet: 'A deep architectural look into how Nehemiah structured accountability and prayer boundaries to rebuild what the enemy broke down.',
        date: '2 days ago',
        readTime: '4 min read'
    }
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

export const HomePage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [checkInStatus, setCheckInStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleCheckIn = () => {
        if (!navigator.geolocation) {
            setCheckInStatus('error');
            setErrorMessage('Geolocation is not supported by your browser.');
            return;
        }

        setCheckInStatus('loading');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const distance = calculateDistance(
                    position.coords.latitude,
                    position.coords.longitude,
                    UPCOMING_EVENT.latitude,
                    UPCOMING_EVENT.longitude
                );

                if (distance <= CHECK_IN_RADIUS_METERS) {
                    setCheckInStatus('success');
                } else {
                    setCheckInStatus('error');
                    setErrorMessage(`You must be within a ${CHECK_IN_RADIUS_METERS}m radius around the church premises to check into this service.`);
                }
            },
            () => {
                setCheckInStatus('error');
                setErrorMessage('Unable to verify your location. Please check your device settings.');
            },
            { enableHighAccuracy: true }
        );
    };

    const resetModal = () => {
        setIsModalOpen(false);
        setCheckInStatus('idle');
        setErrorMessage('');
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            <div className="relative w-full h-[60vh] md:h-[65vh] overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={UPCOMING_EVENT.image}
                        alt={UPCOMING_EVENT.title}
                        className="w-full h-full object-cover scale-105 transform transition duration-10000 ease-out"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-transparent to-black/10" />
                </div>

                <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/40 to-transparent z-10">
                    <div>
                        <span className="text-xs uppercase tracking-widest text-white/70 font-semibold">RCCG DISCOVERY CENTER</span>
                        <h1 className="text-lg font-light tracking-tight text-white">Church</h1>
                    </div>
                    {UPCOMING_EVENT.isLive && (
                        <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-white">Live Now</span>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end z-10">
                    <span className="text-[11px] uppercase tracking-widest text-[#EADCC9] font-bold mb-2 flex items-center gap-1.5">
                        {UPCOMING_EVENT.isLive ? <Flame size={12} className="text-red-500 fill-red-500" /> : <Volume2 size={12} className="text-white" />}
                        {UPCOMING_EVENT.isLive ? 'Current Gathering' : 'Next Event'}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight max-w-md leading-tight mb-1 text-white">
                        {UPCOMING_EVENT.title}
                    </h2>
                    <p className="text-sm text-white/80 font-light mb-4">
                        {UPCOMING_EVENT.scripture}
                    </p>

                    {UPCOMING_EVENT.isLive && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="self-start mb-6 bg-white text-[#121212] text-xs uppercase tracking-widest font-semibold px-5 py-2.5 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                        >
                            Check-in to Service
                        </button>
                    )}

                    <div className="flex items-center justify-between bg-black/20 backdrop-blur-md border border-white/10 p-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="bg-white text-[#121212] px-3 py-1.5 flex flex-col items-center justify-center min-w-[50px]">
                                <span className="text-lg font-bold leading-none">{UPCOMING_EVENT.date.split(' ')[0]}</span>
                                <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">{UPCOMING_EVENT.date.split(' ')[1]}</span>
                            </div>
                            <div>
                                <p className="text-xs text-white/60 font-light">Service Time</p>
                                <p className="text-sm font-semibold text-white">{UPCOMING_EVENT.time}</p>
                            </div>
                        </div>
                        {/* <button className="w-10 h-10 rounded-full bg-white text-[#121212] flex items-center justify-center hover:scale-105 transition-transform shadow-md">
                            <Play size={16} fill="currentColor" className="ml-0.5" />
                        </button> */}
                    </div>
                </div>
            </div>

            <div className="px-6 mt-6">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">Service Clips</h3>
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                    {STORIES.map((story) => (
                        <div key={story.id} className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer">
                            <div className={`p-[2px] rounded-full transition-transform active:scale-95 ${story.isUnseen ? 'bg-gradient-to-tr from-[#121212] via-[#8A817C] to-[#121212]' : 'border border-[#121212]/20'
                                }`}>
                                <div className="w-16 h-16 rounded-full border-2 border-[#FFFFFF] overflow-hidden bg-gray-200">
                                    <img src={story.thumbnail} alt={story.title} className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <span className="text-[10px] text-gray-600 font-medium text-center max-w-[72px] truncate">
                                {story.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-6 mt-10 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Updates & Articles</h3>
                    <button className="text-xs text-[#121212] font-semibold flex items-center gap-1 hover:underline">
                        See All <ArrowRight size={12} />
                    </button>
                </div>

                <div className="space-y-4">
                    {FEED_ITEMS.map((item) => (
                        <div
                            key={item.id}
                            className="bg-[#F9F9F9]  p-5 border border-[#121212]/5 shadow-sm transition-all duration-300 hover:border-[#121212]/10"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${item.type === 'ANNOUNCEMENT'
                                    ? 'bg-[#121212]/10 text-[#121212]'
                                    : 'bg-[#121212]/5 text-gray-600'
                                    }`}>
                                    {item.category}
                                </span>
                                <span className="text-[11px] text-gray-400 font-medium">{item.date}</span>
                            </div>

                            <h4 className="text-lg font-normal tracking-tight text-[#121212] mb-2 leading-snug">
                                {item.title}
                            </h4>

                            <p className="text-sm text-gray-600 font-light line-clamp-2 leading-relaxed mb-4">
                                {item.snippet}
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-[#121212]/5">
                                <span className="text-xs text-gray-400 font-light">
                                    {item.type === 'BLOG' ? item.readTime : 'Official Notice'}
                                </span>
                                <button className="text-xs font-semibold text-[#121212] hover:text-gray-600 transition-colors">
                                    {item.type === 'BLOG' ? 'Read Article' : 'View Details'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#121212]/40 backdrop-blur-sm" onClick={resetModal} />

                    <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl border border-gray-100 transform transition-all">
                        <button
                            onClick={resetModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>

                        {checkInStatus === 'idle' && (
                            <div className="text-center pt-4">
                                <div className="w-12 h-12 rounded-full bg-[#121212]/5 flex items-center justify-center mx-auto mb-4 text-[#8A817C]">
                                    <MapPin size={22} />
                                </div>
                                <h3 className="text-xl font-normal tracking-tight mb-2">Service Check-in</h3>
                                <p className="text-sm text-gray-500 font-light mb-6">
                                    Confirm your presence for <span className="font-normal text-[#121212]">"{UPCOMING_EVENT.title}"</span>. We will verify your location to log attendance.
                                </p>
                                <button
                                    onClick={handleCheckIn}
                                    className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
                                >
                                    Verify Location & Check-in
                                </button>
                            </div>
                        )}

                        {checkInStatus === 'loading' && (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-2 border-[#121212] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Verifying coordinates...</p>
                            </div>
                        )}

                        {checkInStatus === 'success' && (
                            <div className="text-center pt-4">
                                <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={24} />
                                </div>
                                <h3 className="text-xl font-normal tracking-tight mb-2">Checked In!</h3>
                                <p className="text-sm text-gray-500 font-light mb-6">
                                    Your attendance has been logged successfully. Blessed fellowship!
                                </p>
                                <button
                                    onClick={resetModal}
                                    className="w-full bg-gray-100 text-[#121212] text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        {checkInStatus === 'error' && (
                            <div className="text-center pt-4">
                                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                                    <X size={22} />
                                </div>
                                <h3 className="text-xl font-normal tracking-tight mb-2">Check-in Failed</h3>
                                <p className="text-sm text-gray-500 font-light mb-6">
                                    {errorMessage}
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCheckInStatus('idle')}
                                        className="flex-1 bg-gray-100 text-[#121212] text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={resetModal}
                                        className="flex-1 bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};