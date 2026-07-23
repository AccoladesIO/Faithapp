"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { SmallGroupsPage } from '@/components/layout/small-groups'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <SmallGroupsPage />
    </Shell>
  )
}

export default withAuth(page)
