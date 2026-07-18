"use client";

import React from "react";
import Shell from "../Shell";
import { withAuth } from "@/utils/auth/with-auth";
import { FollowUpPage } from "@/components/layout/follow-up";

const Page = () => {
    return (
        <Shell activeTab="profile">
            <FollowUpPage />
        </Shell>
    );
};

export default withAuth(Page);
