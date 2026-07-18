"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { SundaySchoolPage } from '@/components/layout/sunday-school'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <SundaySchoolPage />
    </Shell>
  )
}

export default withAuth(page)
