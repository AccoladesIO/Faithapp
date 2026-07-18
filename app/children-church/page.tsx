"use client"


import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth';
import { ChildrenChurchPage } from '@/components/layout/children-church';

const page = () => {
  return (
    <Shell activeTab="profile" >
        <ChildrenChurchPage />
    </Shell>
  )
}

export default withAuth(page)