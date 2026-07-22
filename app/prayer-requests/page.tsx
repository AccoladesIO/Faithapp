"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { PrayerRequestsPage } from '@/components/layout/prayer-requests'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <PrayerRequestsPage />
    </Shell>
  )
}

export default withAuth(page)
