"use client";

import React from "react";
import Shell from "../Shell";
import { withAuth } from "@/utils/auth/with-auth";
import { DashboardPage } from "@/components/layout/dashboard";

const Page = () => {
    return (
        <Shell activeTab="profile">
            <DashboardPage />
        </Shell>
    );
};

export default withAuth(Page);
