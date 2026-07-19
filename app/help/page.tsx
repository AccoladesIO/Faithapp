"use client"

import React from 'react'
import Shell from '../Shell'
import { HelpPage } from '@/components/layout/help'
import { withAuth } from '@/utils/auth/with-auth';

const page = () => {
  return (
    <Shell activeTab="profile" >
      <HelpPage />
    </Shell>
  )
}

export default withAuth(page)
