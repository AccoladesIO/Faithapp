"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { ServiceHistoryPage } from '@/components/layout/service-history'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <ServiceHistoryPage />
    </Shell>
  )
}

export default withAuth(page)
