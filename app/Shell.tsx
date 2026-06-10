"use client"

import { BottomNav } from '@/components/layout/bottom-nav';
// import Header from '@/components/layout/header';
import React, { useState } from 'react';


export default function AppLayout({ activeTab, children }: { activeTab: string, children: React.ReactNode }) {
    const [userRole, setUserRole] = useState<'MEMBER' | 'WORKER' | null>('WORKER');

    return (
        <div className="relative min-h-screen bg-slate-50">
            {/* <Header /> */}
            <main className="">
                {children}
            </main>
            <BottomNav
                userRole={userRole}
                activeTab={activeTab}
            />
        </div>
    );
}