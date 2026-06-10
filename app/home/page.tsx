import React from 'react'
import Shell from '../Shell'
import { HomePage } from '@/components/layout/home'

const page = () => {
  return (
    <Shell activeTab="home" >
      <HomePage />
    </Shell>
  )
}

export default page