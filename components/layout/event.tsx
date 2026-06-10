import React from 'react';
import { Plus, Clock, MapPin } from 'lucide-react';

interface ChurchEvent {
    id: string;
    book: string;
    chapters: string;
    title: string;
    date: string;
    dayNum: string;
    monthStr: string;
    time: string;
    variant: 'highlight' | 'standard' | 'muted';
}

const UPCOMING_EVENTS: ChurchEvent[] = [
    {
        id: 'evt-1',
        book: 'Esther',
        chapters: '3-7',
        title: 'Who Is Your King?',
        date: '3 Aug',
        dayNum: '3',
        monthStr: 'Aug',
        time: '7:30 – 9:00 am',
        variant: 'highlight'
    },
    {
        id: 'evt-2',
        book: 'Esther',
        chapters: '8 & 9',
        title: 'Relief From Enemies',
        date: '10 Aug',
        dayNum: '10',
        monthStr: 'Aug',
        time: '8:00 – 10:20 am',
        variant: 'standard'
    },
    {
        id: 'evt-3',
        book: 'Nehemiah',
        chapters: '5',
        title: 'Justice For The Poor',
        date: '17 Aug',
        dayNum: '17',
        monthStr: 'Aug',
        time: '9:30 – 11:00 am',
        variant: 'standard'
    },
    {
        id: 'evt-4',
        book: 'Isaiah',
        chapters: '61',
        title: 'Lessons And Restoration',
        date: '24 Aug',
        dayNum: '24',
        monthStr: 'Aug',
        time: '8:00 – 9:30 am',
        variant: 'muted'
    }
];

export const EventsPage = () => {
    const featuredEvent = UPCOMING_EVENTS[0];

    return (
        <div className="min-h-screen bg-[#F4F1EA] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#F4F1EA]">

            <div className="fixed top-0 left-0 w-full lg:w-[41.666667%] h-[40vh] lg:h-screen z-0 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=800&auto=format&fit=crop"
                    alt="Church gathering banner"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen relative z-10 pointer-events-none">
                <div className="h-[40vh] lg:h-screen lg:col-span-5" />

                <div className="lg:col-span-7 bg-[#F4F1EA] pt-6 lg:pt-12 pointer-events-auto">

                    <div className="p-6 lg:px-12 flex flex-col justify-between min-h-[45vh] lg:min-h-[55vh]">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs uppercase tracking-widest text-[#8A817C] font-semibold">RCCG DISCOVERY CENTER</span>
                                <h1 className="text-xl font-light tracking-tight text-[#121212]">Church</h1>
                            </div>
                        </div>

                        <div className="mt-8 lg:mt-0 max-w-xl">
                            <h2 className="text-4xl lg:text-5xl font-light tracking-tight leading-tight text-[#121212]">
                                Take a <span className="text-[#8A817C] font-normal">step</span> toward the light
                            </h2>

                            <div className="mt-6 flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    <img className="w-8 h-8 rounded-full border-2 border-[#F4F1EA] object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="Member avatar" />
                                    <img className="w-8 h-8 rounded-full border-2 border-[#F4F1EA] object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop" alt="Member avatar" />
                                </div>
                                <button className="w-8 h-8 rounded-full bg-[#8A817C]/20 text-[#121212] flex items-center justify-center hover:bg-[#8A817C]/30 transition-colors">
                                    <Plus size={14} />
                                </button>
                                <span className="text-xs text-gray-500 font-medium">Join 142 others attending</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[#121212]/5 grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock size={14} className="text-[#8A817C]" />
                                <span className="text-xs font-medium">{featuredEvent.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <MapPin size={14} className="text-[#8A817C]" />
                                <span className="text-xs font-medium">Main Sanctuary</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 lg:px-12 mt-12 max-w-3xl">
                        <h3 className="text-2xl font-light tracking-tight mb-6 text-[#121212]">Upcoming Series</h3>

                        <div className="space-y-3">
                            {UPCOMING_EVENTS.map((item) => {
                                const isHighlight = item.variant === 'highlight';
                                const isMuted = item.variant === 'muted';

                                return (
                                    <div
                                        key={item.id}
                                        className={` transition-all duration-300 flex items-center p-4 border ${isHighlight
                                            ? 'bg-[#EADCC9] border-[#8A817C]/20 shadow-sm'
                                            : 'bg-white border-[#121212]/5 shadow-sm hover:border-[#121212]/10'
                                            } ${isMuted ? 'opacity-60' : ''}`}
                                    >
                                        <div className={`px-4 py-3 flex flex-col items-center justify-center min-w-[64px] h-[100px] border ${isHighlight
                                            ? 'bg-white border-transparent text-[#121212]'
                                            : 'bg-[#F4F1EA] border-transparent text-[#121212]'
                                            }`}>
                                            <span className="text-xl font-bold leading-none">{item.dayNum}</span>
                                            <span className="text-[10px] uppercase tracking-wider font-bold opacity-70 mt-1">{item.monthStr}</span>
                                        </div>

                                        <div className="ml-5 flex-grow pr-4">
                                            <span className="text-xs font-medium text-[#8A817C] tracking-wide block mb-0.5">
                                                {item.book} {item.chapters}
                                            </span>
                                            <h4 className="text-lg font-normal tracking-tight text-[#121212] leading-snug">
                                                {item.title}
                                            </h4>
                                            <span className="text-xs text-gray-500 font-light block mt-1 lg:hidden">
                                                {item.time}
                                            </span>
                                        </div>

                                        <div className="hidden lg:flex flex-col items-end justify-center text-right min-w-[120px]">
                                            <span className="text-xs font-medium text-[#121212]/70 flex items-center gap-1">
                                                <Clock size={12} className="text-[#8A817C]" />
                                                {item.time.split(' ')[0]}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mt-0.5">
                                                {item.time.split(' ').slice(1).join(' ')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
};