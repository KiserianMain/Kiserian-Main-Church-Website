import { useState, useEffect } from 'react'
import { Users, Settings, Megaphone, DollarSign, BarChart, Shield, Database } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPayments: 0,
    totalDepartments: 0,
    totalAnnouncements: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      // Mock admin stats
      setStats({
        totalUsers: 245,
        totalPayments: 1250000,
        totalDepartments: 8,
        totalAnnouncements: 156
      })
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const adminModules = [
    {
      title: 'User Management',
      description: 'Manage church members and roles',
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      link: '/admin/users',
      permissions: ['Super Admin', 'Pastor', 'First Elder']
    },
    {
      title: 'Department Management',
      description: 'Create and manage church departments',
      icon: Settings,
      color: 'bg-green-100 text-green-600',
      link: '/admin/departments',
      permissions: ['Super Admin', 'Pastor', 'First Elder']
    },
    {
      title: 'Announcement Management',
      description: 'Manage all church announcements',
      icon: Megaphone,
      color: 'bg-purple-100 text-purple-600',
      link: '/admin/announcements',
      permissions: ['Super Admin', 'Pastor', 'First Elder', 'Department Head']
    },
    {
      title: 'Payment Management',
      description: 'View and manage all payments',
      icon: DollarSign,
      color: 'bg-yellow-100 text-yellow-600',
      link: '/admin/payments',
      permissions: ['Super Admin', 'Pastor', 'First Elder']
    },
    {
      title: 'SMS Management',
      description: 'Send bulk SMS and manage templates',
      icon: BarChart,
      color: 'bg-red-100 text-red-600',
      link: '/admin/sms',
      permissions: ['Super Admin', 'Pastor', 'First Elder', 'Department Head']
    },
    {
      title: 'System Settings',
      description: 'Configure system settings',
      icon: Shield,
      color: 'bg-indigo-100 text-indigo-600',
      link: '/admin/settings',
      permissions: ['Super Admin']
    },
    {
      title: 'Database Management',
      description: 'Database backup and maintenance',
      icon: Database,
      color: 'bg-gray-100 text-gray-600',
      link: '/admin/database',
      permissions: ['Super Admin']
    }
  ]

  const hasPermission = (permissions) => {
    if (!permissions) return true
    return user?.roles?.some(role => permissions.includes(role))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          System administration and management
        </p>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {(stats.totalPayments / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Departments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalDepartments}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Announcements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalAnnouncements}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Megaphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Modules */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Administration Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules
            .filter(module => hasPermission(module.permissions))
            .map((module, index) => {
              const Icon = module.icon
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => {
                    // Navigate to module
                    console.log(`Navigate to ${module.link}`)
                  }}
                >
                  <div className={`inline-flex p-3 rounded-lg ${module.color} mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600">
                    {module.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {module.description}
                  </p>
                </div>
              )
            })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent System Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                New user registration
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                John Doe registered 2 hours ago
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Payment received
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                KES 5,000 from Jane Smith 4 hours ago
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                New announcement posted
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sabbath School updates 6 hours ago
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
