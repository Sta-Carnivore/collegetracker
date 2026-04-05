'use client'

import { useState, useCallback } from 'react'
import { School, Application } from '@/types/database'
import SchoolCard from '@/components/dashboard/SchoolCard'

interface Props {
  schools: School[]
  initialApplications: Application[]
}

export default function DashboardClient({ schools, initialApplications }: Props) {
  const [applications, setApplications] = useState<Application[]>(initialApplications)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/applications')
    if (res.ok) {
      const data = await res.json()
      setApplications(data)
    }
  }, [])

  const appBySchool = (schoolId: string) =>
    applications.find((a) => a.school_id === schoolId) ?? null

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">My Applications</h1>
        <span className="text-gray-500 text-sm">{schools.length} schools</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map((school) => (
          <SchoolCard
            key={school.id}
            school={school}
            application={appBySchool(school.id)}
            onUpdate={refresh}
          />
        ))}
      </div>
    </div>
  )
}
