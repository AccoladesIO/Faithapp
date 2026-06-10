import React from 'react'
import Shell from '../Shell'
import { EventsPage } from '@/components/layout/event'

const page = () => {
  return (
    <Shell activeTab="events" >
      <EventsPage />
    </Shell>
  )
}

export default page