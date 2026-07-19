"use client";

import React from "react";
import Shell from "../../Shell";
import { withAuth } from "@/utils/auth/with-auth";
import { AttendanceDepartmentPage } from "@/components/layout/attendance-department";

const Page = () => {
    return (
        <Shell activeTab="profile">
            <AttendanceDepartmentPage />
        </Shell>
    );
};

export default withAuth(Page);
