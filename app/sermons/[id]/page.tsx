"use client";

import React, { use } from "react";
import Shell from "../../Shell";
import { withAuth } from "@/utils/auth/with-auth";
import { SermonDetailPage } from "@/components/layout/sermon-detail";

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = use(params);
    return (
        <Shell activeTab="profile">
            <SermonDetailPage id={id} />
        </Shell>
    );
};

export default withAuth(Page);
