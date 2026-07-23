"use client";

import React, { use } from "react";
import Shell from "../../Shell";
import { withAuth } from "@/utils/auth/with-auth";
import { GameSessionPage } from "@/components/layout/game-session";

const Page = ({ params }: { params: Promise<{ code: string }> }) => {
    const { code } = use(params);
    return (
        <Shell activeTab="profile">
            <GameSessionPage code={code} />
        </Shell>
    );
};

export default withAuth(Page);
