"use client"
import React from 'react'
import Shell from '../Shell'
import { ProfilePage } from '@/components/layout/profile'
import { withAuth } from '@/utils/auth/with-auth';

const page = () => {
  return (
    <Shell activeTab="profile" >
      <ProfilePage />
    </Shell>
  )
}

export default withAuth(page)