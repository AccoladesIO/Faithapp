"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { FacilityRentalPage } from '@/components/layout/facility-rental'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <FacilityRentalPage />
    </Shell>
  )
}

export default withAuth(page)
