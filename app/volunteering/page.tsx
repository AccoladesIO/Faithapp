"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { VolunteeringPage } from '@/components/layout/volunteering'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <VolunteeringPage />
    </Shell>
  )
}

export default withAuth(page)
