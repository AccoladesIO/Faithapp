import React from 'react'
import Shell from '../Shell'
import { ProfilePage } from '@/components/layout/profile'

const page = () => {
  return (
    <Shell activeTab="profile" >
      <ProfilePage />
    </Shell>
  )
}

export default page