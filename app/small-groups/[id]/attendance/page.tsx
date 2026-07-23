"use client"

import React, { use } from "react";
import Shell from "../../../Shell";
import { withAuth } from "@/utils/auth/with-auth";
import { SmallGroupAttendancePage } from "@/components/layout/small-group-attendance";

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = use(params);
    return (
        <Shell activeTab="profile">
            <SmallGroupAttendancePage groupId={id} />
        </Shell>
    );
};

export default withAuth(Page);
