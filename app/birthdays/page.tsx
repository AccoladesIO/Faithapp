"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { BirthdayWishesPage } from '@/components/layout/birthday-wishes'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <BirthdayWishesPage />
    </Shell>
  )
}

export default withAuth(page)
