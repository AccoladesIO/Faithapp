"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { DepartmentFeedbackPage } from '@/components/layout/department-feedback'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <DepartmentFeedbackPage />
    </Shell>
  )
}

export default withAuth(page)
