import React from 'react'
import Shell from '../Shell'
import { PersonalAttendancePage } from '@/components/layout/attendance'

const page = () => {
  return (
    <Shell activeTab="attendance" >
      <PersonalAttendancePage />
    </Shell>
  )
}

export default page