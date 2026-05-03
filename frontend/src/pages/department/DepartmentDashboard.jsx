import { useState, useEffect } from 'react'
import { Users, Settings, Megaphone, Calendar, DollarSign, Mail } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const DepartmentDashboard = () => {
  const { user } = useAuth()
  const [department, setDepartment] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDepartmentData()
  }, [])

  const fetchDepartmentData = async () => {
    try {
      // Mock data for now
      setDepartment({
        id: 'dept-1',
        name: 'Sabbath School',
        description: 'Bible study and spiritual education for all ages',
        member_count: 45
      })
      
      setMembers([
        { id: 1, name: 'John Doe', role: 'Superintendent', joined: '2023-01-15' },
        { id: 2, name: 'Jane Smith', role: 'Teacher', joined: '2023-02-20' },
        { id: 3, name: 'Mike Johnson', role: 'Assistant', joined: '2023-03-10' },
      ])
    } catch (error) {
      console.error('Failed to fetch department data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const quickActions = [
    { title: 'Manage Members', icon: Users, description: 'Add/remove department members' },
    { title: 'Send Announcement', icon: Megaphone, description: 'Create department announcements' },
    { title: 'Schedule Meeting', icon: Calendar, description: 'Organize department meetings' },
    { title: 'Send SMS', icon: Mail, description: 'Bulk SMS to members' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Department Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your department and members
        </p>
      </div>

      {/* Department Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {department?.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {department?.description}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">
              {department?.member_count}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Members</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left group"
              >
                <div className="inline-flex p-3 bg-primary-100 dark:bg-primary-900 rounded-lg mb-4">
                  <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {action.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Department Members</h2>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Joined {new Date(member.joined).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Department Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Total Members</span>
              <span className="font-semibold text-gray-900 dark:text-white">{department?.member_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Active This Month</span>
              <span className="font-semibold text-green-600">38</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Meetings This Month</span>
              <span className="font-semibold text-blue-600">4</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Avg Attendance</span>
              <span className="font-semibold text-purple-600">85%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DepartmentDashboard
