"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { PrayerPage } from '@/components/layout/prayer'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <PrayerPage />
    </Shell>
  )
}

export default withAuth(page)
