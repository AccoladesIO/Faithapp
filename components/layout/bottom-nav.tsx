import React from 'react';
import { Home, Calendar, CheckSquare, LayoutGrid, HeartHandshake } from 'lucide-react';
import { useRouter } from 'next/navigation';

type UserRole = 'MEMBER' | 'WORKER' | null;

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    requiredRole?: UserRole;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    { id: 'giving', label: 'Giving', icon: HeartHandshake },
    { id: 'profile', label: 'More', icon: LayoutGrid },
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
        <nav aria-label="Primary" className="fixed z-20 bottom-10 left-1/2 -translate-x-1/2 bg-[#121212] p-2 rounded-full flex items-center gap-2 shadow-xl border border-white/5">
            {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => router.push(`/${item.id}`)}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                        className={`relative w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EADCC9] ${isActive ? 'bg-[#EADCC9] scale-110' : 'bg-transparent hover:bg-[#EADCC9]/5'
                            }`}
                    >
                        <Icon
                            size={18}
                            className={isActive ? 'text-[#121212]' : 'text-[#756E69]'}
                            strokeWidth={isActive ? 2.5 : 1.5}
                        />
                    </button>
                );
            })}
        </nav>
    );
};