"use client";

import React, { use } from "react";
import Shell from "../../Shell";
import { withAuth } from "@/utils/auth/with-auth";
import { AnnouncementDetailPage } from "@/components/layout/announcement-detail";

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = use(params);
    return (
        <Shell activeTab="home">
            <AnnouncementDetailPage id={id} />
        </Shell>
    );
};

export default withAuth(Page);
