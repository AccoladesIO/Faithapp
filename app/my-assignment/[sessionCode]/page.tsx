"use client";

import React, { use } from "react";
import Shell from "../../Shell";
import { withAuth } from "@/utils/auth/with-auth";
import { MyLiveAssignmentPage } from "@/components/layout/my-live-assignment";

const Page = ({ params }: { params: Promise<{ sessionCode: string }> }) => {
    const { sessionCode } = use(params);
    return (
        <Shell activeTab="home">
            <MyLiveAssignmentPage sessionCode={sessionCode} />
        </Shell>
    );
};

export default withAuth(Page);
