"use client"

import React from 'react'
import Shell from '../Shell'
import { GivingPage } from '@/components/layout/giving'
import { withAuth } from '@/utils/auth/with-auth';

const page = () => {
  return (
    <Shell activeTab="profile" >
      <GivingPage />
    </Shell>
  )
}

export default withAuth(page)