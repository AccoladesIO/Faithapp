"use client";

import React, { use } from "react";
import Shell from "../../Shell";
import { withAuth } from "@/utils/auth/with-auth";
import { ClassDetailPage } from "@/components/layout/classes";

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = use(params);
    return (
        <Shell activeTab="profile">
            <ClassDetailPage id={id} />
        </Shell>
    );
};

export default withAuth(Page);
