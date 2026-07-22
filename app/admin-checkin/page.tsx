"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { AdminCheckinPage } from '@/components/layout/admin-checkin'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <AdminCheckinPage />
    </Shell>
  )
}

export default withAuth(page)
