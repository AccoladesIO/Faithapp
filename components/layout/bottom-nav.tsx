import React from 'react';
import { Home, Calendar, CheckSquare, HeartHandshake, UserCircle, Baby } from 'lucide-react';
import { useRouter } from 'next/navigation';

type UserRole = 'MEMBER' | 'WORKER' | null;

interface NavItem {
    id: string;
    icon: React.ElementType;
    requiredRole?: UserRole;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'home', icon: Home },
    { id: 'events', icon: Calendar },
    { id: 'attendance', icon: CheckSquare},
    { id: 'children-church', icon: Baby },
    { id: 'profile', icon: UserCircle },
];

export const BottomNav = ({
    userRole,
    activeTab,
}: {
    userRole: UserRole;
    activeTab: string;
}) => {
    const filteredItems = NAV_ITEMS.filter(
        item => !item.requiredRole || item.requiredRole === userRole
    );

    const router = useRouter();

    return (
        <div className="fixed z-20 bottom-10 left-1/2 -translate-x-1/2 bg-[#121212] p-2 rounded-full flex items-center gap-2 shadow-xl border border-white/5">
            {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => router.push(`/${item.id}`)}
                        className={`relative w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full transition-all duration-300 ${isActive ? 'bg-[#EADCC9] scale-110' : 'bg-transparent hover:bg-[#EADCC9]/5'
                            }`}
                    >
                        <Icon
                            size={18}
                            className={isActive ? 'text-[#121212]' : 'text-[#8A817C]'}
                            strokeWidth={isActive ? 2.5 : 1.5}
                        />
                    </button>
                );
            })}
        </div>
    );
};