"use client"


import React from 'react'
import Shell from '../Shell'
import { EventsPage } from '@/components/layout/event'
import { withAuth } from '@/utils/auth/with-auth';

const page = () => {
  return (
    <Shell activeTab="events" >
      <EventsPage />
    </Shell>
  )
}

export default withAuth(page)