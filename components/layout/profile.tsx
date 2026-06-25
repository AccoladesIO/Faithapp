"use client"

import React, { useState, useMemo } from 'react';
import { User, Shield, Bell, CircleHelp, LogOut, ChevronRight, ChevronDown, Sparkles, HeartHandshake, Calendar, ClipboardList, PackagePlus, Search } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface UserProfile {
    name: string;
    email: string;
    role: 'MEMBER' | 'WORKER';
    joinDate: string;
    avatar: string;
}

const CURRENT_USER: UserProfile = {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@christfamily.org',
    role: 'WORKER',
    joinDate: 'Joined Oct 2024',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'
};

const MOCK_INVENTORY_ITEMS = [
    { id: 'inv_1', name: 'Soundcraft UI24R Wireless Mixer' },
    { id: 'inv_2', name: 'Shure SM58 Wireless Microphone' },
    { id: 'inv_3', name: 'Epson Pro Projector 6K Lumens' },
    { id: 'inv_4', name: 'Heavy Duty XLR Cable 10m' },
    { id: 'inv_5', name: 'LED Stage Par Can Light' },
];

export const ProfilePage = () => {
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const [leaveForm, setLeaveForm] = useState({
        dateFrom: '',
        dateTo: '',
        reason: ''
    });

    const [inventoryForm, setInventoryForm] = useState({
        inventory_id: '',
        quantity_requested: 1,
        from_date: '',
        to_date: '',
        reason: '',
        status: 'Pending'
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [isInventoryDropdownOpen, setIsInventoryDropdownOpen] = useState(false);
    const { logout } = useAuth()

    const filteredInventory = useMemo(() => {
        return MOCK_INVENTORY_ITEMS.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const selectedInventoryName = useMemo(() => {
        return MOCK_INVENTORY_ITEMS.find(item => item.id === inventoryForm.inventory_id)?.name || 'Select an item';
    }, [inventoryForm.inventory_id]);

    const toggleSection = (sectionName: string) => {
        setActiveSection(prev => prev === sectionName ? null : sectionName);
    };

    const handleLeaveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            dateFrom: leaveForm.dateFrom ? leaveForm.dateFrom.replace('T', ' ') : '',
            dateTo: leaveForm.dateTo ? leaveForm.dateTo.replace('T', ' ') : '',
            reason: leaveForm.reason
        };
        console.log('LEAVE_REQUEST POST BODY DATA:', payload);
    };

    const handleInventorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('INVENTORY_REQUEST POST BODY DATA:', {
            ...inventoryForm,
            requester_id: 'current_user_id_here',
            department_id: 'current_department_id_here'
        });
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            <div className="relative w-full h-[24vh] md:h-[28vh] overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1445108771252-d1cc31a02a3c?q=80&w=1200&auto=format&fit=crop"
                    alt="Church sanctuary backdrop"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#F9F9F9] via-[#F9F9F9]/40 to-transparent" />
            </div>

            <div className="px-6 -mt-16 relative z-10 flex flex-col items-center text-center border-b border-[#121212]/5 pb-6 bg-gradient-to-b from-transparent to-[#F9F9F9]">
                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-200 shadow-lg">
                    <img src={CURRENT_USER.avatar} alt={CURRENT_USER.name} className="w-full h-full object-cover" />
                </div>

                <h2 className="text-2xl font-light tracking-tight mt-3 text-[#121212]">
                    {CURRENT_USER.name}
                </h2>
                <p className="text-xs text-gray-500 font-light mt-0.5">
                    {CURRENT_USER.email}
                </p>

                <div className="flex items-center gap-2 mt-3">
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-[#121212] text-white px-2.5 py-0.5 rounded-full shadow-sm">
                        {CURRENT_USER.role}
                    </span>
                    <span className="text-[10px] text-gray-400 font-light">
                        {CURRENT_USER.joinDate}
                    </span>
                </div>
            </div>

            <div className="px-6 mt-8 max-w-md mx-auto space-y-6">

                <div
                    onClick={() => toggleSection('spiritual_giftings')}
                    className="bg-[#F4F1EA]/50 border border-[#121212]/5 rounded-2xl p-4 flex flex-col cursor-pointer transition-all hover:bg-[#EADCC9]/30"
                >
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#EADCC9] flex items-center justify-center text-[#121212]">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-[#121212]">Spiritual Giftings</h3>
                                <p className="text-xs text-gray-500 font-light mt-0.5">View your assessed domains & callings</p>
                            </div>
                        </div>
                        {activeSection === 'spiritual_giftings' ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    </div>

                    {activeSection === 'spiritual_giftings' && (
                        <div className="mt-4 pt-4 border-t border-[#121212]/5 text-xs text-gray-600 space-y-2 font-light">
                            <p><strong>Primary Domain:</strong> Leadership & Administration</p>
                            <p><strong>Secondary Domain:</strong> Teaching & Exhortation</p>
                        </div>
                    )}
                </div>

                {CURRENT_USER.role === 'WORKER' && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
                            Worker Operations
                        </h4>

                        <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 shadow-sm overflow-hidden">
                            <div>
                                <button
                                    onClick={() => toggleSection('leave_request')}
                                    className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <ClipboardList size={16} className="text-[#8A817C]" />
                                        <span className="text-sm font-normal">Leave Request</span>
                                    </div>
                                    {activeSection === 'leave_request' ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                                </button>

                                {activeSection === 'leave_request' && (
                                    <div className="p-4 bg-[#F9F9F9] border-t border-[#121212]/5">
                                        <form onSubmit={handleLeaveSubmit} className="space-y-3.5">
                                            <div>
                                                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Date From</label>
                                                <input
                                                    type="datetime-local"
                                                    value={leaveForm.dateFrom}
                                                    onChange={e => setLeaveForm(prev => ({ ...prev, dateFrom: e.target.value }))}
                                                    required
                                                    className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2 text-xs font-sans outline-none focus:border-[#121212]/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Date To</label>
                                                <input
                                                    type="datetime-local"
                                                    value={leaveForm.dateTo}
                                                    onChange={e => setLeaveForm(prev => ({ ...prev, dateTo: e.target.value }))}
                                                    required
                                                    className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2 text-xs font-sans outline-none focus:border-[#121212]/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Reason</label>
                                                <textarea
                                                    rows={3}
                                                    value={leaveForm.reason}
                                                    onChange={e => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                                                    placeholder="Reason for leave application..."
                                                    required
                                                    className="w-full bg-white border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30"
                                                />
                                            </div>
                                            <button type="submit" className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-2.5 rounded-xl transition-opacity hover:opacity-90">
                                                Submit Leave Application
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>

                            <div>
                                <button
                                    onClick={() => toggleSection('inventory_request')}
                                    className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <PackagePlus size={16} className="text-[#8A817C]" />
                                        <span className="text-sm font-normal">Inventory Request</span>
                                    </div>
                                    {activeSection === 'inventory_request' ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                                </button>

                                {activeSection === 'inventory_request' && (
                                    <div className="p-4 bg-[#F9F9F9] border-t border-[#121212]/5">
                                        <form onSubmit={handleInventorySubmit} className="space-y-3.5">
                                            <div className="relative">
                                                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Select Inventory Item</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsInventoryDropdownOpen(!isInventoryDropdownOpen)}
                                                    className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs text-left flex items-center justify-between outline-none"
                                                >
                                                    <span className={inventoryForm.inventory_id ? 'text-[#121212]' : 'text-gray-400'}>{selectedInventoryName}</span>
                                                    <ChevronDown size={14} className="text-gray-400" />
                                                </button>

                                                {isInventoryDropdownOpen && (
                                                    <div className="absolute z-20 w-full mt-1 bg-white border border-[#121212]/10 rounded-xl shadow-lg max-h-56 overflow-hidden flex flex-col">
                                                        <div className="p-2 border-b border-[#121212]/5 flex items-center gap-2 bg-gray-50">
                                                            <Search size={12} className="text-gray-400 shrink-0" />
                                                            <input
                                                                type="text"
                                                                placeholder="Search equipment..."
                                                                value={searchQuery}
                                                                onChange={e => setSearchQuery(e.target.value)}
                                                                className="w-full bg-transparent text-xs outline-none font-sans"
                                                            />
                                                        </div>
                                                        <div className="overflow-y-auto divide-y divide-[#121212]/5">
                                                            {filteredInventory.length > 0 ? (
                                                                filteredInventory.map(item => (
                                                                    <button
                                                                        key={item.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setInventoryForm(prev => ({ ...prev, inventory_id: item.id }));
                                                                            setIsInventoryDropdownOpen(false);
                                                                            setSearchQuery('');
                                                                        }}
                                                                        className="w-full text-left px-3 py-2.5 text-xs hover:bg-[#F9F9F9] transition-colors"
                                                                    >
                                                                        {item.name}
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                <div className="p-3 text-xs text-gray-400 text-center">No items match criteria</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Quantity Requested</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={inventoryForm.quantity_requested}
                                                    onChange={e => setInventoryForm(prev => ({ ...prev, quantity_requested: parseInt(e.target.value) || 1 }))}
                                                    required
                                                    className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2 text-xs font-sans outline-none focus:border-[#121212]/30"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1">From Date</label>
                                                    <input
                                                        type="date"
                                                        value={inventoryForm.from_date}
                                                        onChange={e => setInventoryForm(prev => ({ ...prev, from_date: e.target.value }))}
                                                        required
                                                        className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2 text-xs font-sans outline-none focus:border-[#121212]/30"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1">To Date</label>
                                                    <input
                                                        type="date"
                                                        value={inventoryForm.to_date}
                                                        onChange={e => setInventoryForm(prev => ({ ...prev, to_date: e.target.value }))}
                                                        required
                                                        className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2 text-xs font-sans outline-none focus:border-[#121212]/30"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Reason for Ask</label>
                                                <textarea
                                                    rows={3}
                                                    value={inventoryForm.reason}
                                                    onChange={e => setInventoryForm(prev => ({ ...prev, reason: e.target.value }))}
                                                    placeholder="State alternative context or usage parameters..."
                                                    required
                                                    className="w-full bg-white border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30"
                                                />
                                            </div>

                                            <button type="submit" className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-2.5 rounded-xl transition-opacity hover:opacity-90">
                                                Submit Allocation Claim
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
                        Personal Hub
                    </h4>

                    <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 shadow-sm overflow-hidden">
                        <div>
                            <button
                                onClick={() => toggleSection('account_details')}
                                className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <User size={16} className="text-[#8A817C]" />
                                    <span className="text-sm font-normal">Account Details</span>
                                </div>
                                {activeSection === 'account_details' ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                            </button>
                            {activeSection === 'account_details' && (
                                <div className="p-4 bg-[#F9F9F9] border-t border-[#121212]/5 text-xs text-gray-600 space-y-1.5 font-light">
                                    <p><strong>Legal Name:</strong> Sarah Jenkins</p>
                                    <p><strong>Registered ID:</strong> CF-2024-8942</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                onClick={() => toggleSection('serving_rota')}
                                className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <Calendar size={16} className="text-[#8A817C]" />
                                    <span className="text-sm font-normal">My Serving Rota</span>
                                </div>
                                {activeSection === 'serving_rota' ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                            </button>
                            {activeSection === 'serving_rota' && (
                                <div className="p-4 bg-[#F9F9F9] border-t border-[#121212]/5 text-xs text-gray-600 font-light">
                                    <p>Upcoming Assignment: Technical Desk Production Team (Sunday Service: 08:00 AM)</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                onClick={() => toggleSection('tax_statements')}
                                className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <HeartHandshake size={16} className="text-[#8A817C]" />
                                    <span className="text-sm font-normal">Tax Statements & Receipts</span>
                                </div>
                                {activeSection === 'tax_statements' ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                            </button>
                            {activeSection === 'tax_statements' && (
                                <div className="p-4 bg-[#F9F9F9] border-t border-[#121212]/5 text-xs text-gray-600 font-light">
                                    <p>No new financial records found for the active processing interval.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
                        Preferences
                    </h4>

                    <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 shadow-sm overflow-hidden">
                        <div>
                            <button
                                onClick={() => toggleSection('notifications')}
                                className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <Bell size={16} className="text-[#8A817C]" />
                                    <span className="text-sm font-normal">Notifications</span>
                                </div>
                                {activeSection === 'notifications' ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                            </button>
                            {activeSection === 'notifications' && (
                                <div className="p-4 bg-[#F9F9F9] border-t border-[#121212]/5 text-xs text-gray-600 font-light">
                                    <p>Push and email channel dispatch configurations are active.</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                onClick={() => toggleSection('privacy')}
                                className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <Shield size={16} className="text-[#8A817C]" />
                                    <span className="text-sm font-normal">Privacy & Visibility</span>
                                </div>
                                {activeSection === 'privacy' ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                            </button>
                            {activeSection === 'privacy' && (
                                <div className="p-4 bg-[#F9F9F9] border-t border-[#121212]/5 text-xs text-gray-600 font-light">
                                    <p>Profile scope is bounded to organization system members.</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                onClick={() => toggleSection('support')}
                                className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <CircleHelp size={16} className="text-[#8A817C]" />
                                    <span className="text-sm font-normal">Support & Pastoral Care</span>
                                </div>
                                {activeSection === 'support' ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                            </button>
                            {activeSection === 'support' && (
                                <div className="p-4 bg-[#F9F9F9] border-t border-[#121212]/5 text-xs text-gray-600 font-light">
                                    <p>Need guidance or looking to speak to someone? Open an inquiry to dispatch an internal message.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <button onClick={logout} className="w-full bg-red-50 text-red-600 border border-red-100/50 text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-red-100/70 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                        <LogOut size={14} /> Log Out Account
                    </button>
                </div>

            </div>

        </div>
    );
};