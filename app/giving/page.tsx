import React from 'react'
import Shell from '../Shell'
import { GivingPage } from '@/components/layout/giving'

const page = () => {
  return (
    <Shell activeTab="giving" >
      <GivingPage />
    </Shell>
  )
}

export default page