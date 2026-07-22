"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { EvangelismPage } from '@/components/layout/evangelism'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <EvangelismPage />
    </Shell>
  )
}

export default withAuth(page)
