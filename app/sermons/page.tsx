"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { SermonsPage } from '@/components/layout/sermons'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <SermonsPage />
    </Shell>
  )
}

export default withAuth(page)
