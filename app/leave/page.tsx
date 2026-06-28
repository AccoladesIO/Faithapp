"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { LeavePage } from '@/components/layout/leave-request'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <LeavePage />
    </Shell>
  )
}

export default withAuth(page)