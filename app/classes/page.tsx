"use client";

import React from "react";
import Shell from "../Shell";
import { withAuth } from "@/utils/auth/with-auth";
import { ClassesPage } from "@/components/layout/classes";

const Page = () => {
    return (
        <Shell activeTab="profile">
            <ClassesPage />
        </Shell>
    );
};

export default withAuth(Page);
