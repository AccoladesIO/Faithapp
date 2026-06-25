"use client"

import React from 'react'
import Shell from '../Shell'
import { PersonalAttendancePage } from '@/components/layout/attendance'
import { withAuth } from '@/utils/auth/with-auth';

const page = () => {
  return (
    <Shell activeTab="attendance" >
      <PersonalAttendancePage />
    </Shell>
  )
}

export default withAuth(page)