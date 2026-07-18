"use client";

import React, { use } from "react";
import Shell from "../../Shell";
import { withAuth } from "@/utils/auth/with-auth";
import { EventDetailPage } from "@/components/layout/event-detail";

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = use(params);
    return (
        <Shell activeTab="events">
            <EventDetailPage id={id} />
        </Shell>
    );
};

export default withAuth(Page);
