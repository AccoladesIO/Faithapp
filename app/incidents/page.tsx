"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { IncidentsPage } from '@/components/layout/incidents'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <IncidentsPage />
    </Shell>
  )
}

export default withAuth(page)
