"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { DepartmentSummaryPage } from '@/components/layout/department-summary'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <DepartmentSummaryPage />
    </Shell>
  )
}

export default withAuth(page)
