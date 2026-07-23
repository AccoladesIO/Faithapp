"use client"

import React from 'react'
import Shell from '../Shell'
import { withAuth } from '@/utils/auth/with-auth'
import { GamesJoinPage } from '@/components/layout/games-join'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <GamesJoinPage />
    </Shell>
  )
}

export default withAuth(page)
