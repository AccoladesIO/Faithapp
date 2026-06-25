"use client"

import React from 'react'
import Shell from '../Shell'
import { HomePage } from '@/components/layout/home'
import { withAuth } from '@/utils/auth/with-auth'

const page = () => {
  return (
    <Shell activeTab="home" >
      <HomePage />
    </Shell>
  )
}

export default withAuth(page)