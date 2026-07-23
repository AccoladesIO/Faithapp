"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { PastorFeedbackPage } from '@/components/layout/pastor-feedback'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <PastorFeedbackPage />
    </Shell>
  )
}

export default withAuth(page)
