import { useState, useEffect } from 'react'
import { 
  Users, DollarSign, Calendar, Megaphone, TrendingUp, 
  Clock, CheckCircle, AlertCircle, ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalPayments: 0,
    upcomingEvents: 0,
    recentAnnouncements: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats (mock data for now)
      setStats({
        totalMembers: 245,
        totalPayments: 125000,
        upcomingEvents: 5,
        recentAnnouncements: 12
      })

      // Fetch recent activities
      setRecentActivities([
        {
          id: 1,
          type: 'payment',
          title: 'New payment received',
          description: 'John Doe paid KES 5,000',
          time: '2 hours ago',
          icon: DollarSign,
          color: 'text-green-600'
        },
        {
          id: 2,
          type: 'announcement',
          title: 'New announcement posted',
          description: 'Sabbath School updates',
          time: '4 hours ago',
          icon: Megaphone,
          color: 'text-blue-600'
        },
        {
          id: 3,
          type: 'event',
          title: 'New event created',
          description: 'Youth Fellowship Meeting',
          time: '6 hours ago',
          icon: Calendar,
          color: 'text-purple-600'
        },
        {
          id: 4,
          type: 'member',
          title: 'New member registered',
          description: 'Jane Smith joined',
          time: '1 day ago',
          icon: Users,
          color: 'text-orange-600'
        }
      ])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Make Payment',
      description: 'Pay tithe and offerings',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
      link: '/dashboard/payments'
    },
    {
      title: 'View Announcements',
      description: 'Latest church news',
      icon: Megaphone,
      color: 'bg-blue-100 text-blue-600',
      link: '/dashboard/announcements'
    },
    {
      title: 'Upcoming Events',
      description: 'Church calendar',
      icon: Calendar,
      color: 'bg-purple-100 text-purple-600',
      link: '/dashboard/events'
    },
    {
      title: 'Member Directory',
      description: 'Find church members',
      icon: Users,
      color: 'bg-orange-100 text-orange-600',
      link: '/dashboard/members'
    }
  ]

  const isAdmin = user?.roles?.some(role => 
    ['Super Admin', 'Pastor', 'First Elder'].includes(role)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Here's what's happening at SDA Church Kiserian Main today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-full">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalMembers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1 flex-shrink-0" />
            <span className="text-green-500">12% from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-full">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                KES {stats.totalPayments.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1 flex-shrink-0" />
            <span className="text-green-500">8% from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-full">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.upcomingEvents}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <Clock className="h-4 w-4 text-gray-500 mr-1 flex-shrink-0" />
            <span className="text-gray-500">Next event in 2 days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-full">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Announcements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.recentAnnouncements}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg flex-shrink-0">
              <Megaphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <AlertCircle className="h-4 w-4 text-orange-500 mr-1 flex-shrink-0" />
            <span className="text-orange-500">2 urgent</span>
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
              <Link
                key={index}
                to={action.link}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow group h-full flex flex-col"
              >
                <div className={`inline-flex p-3 rounded-lg ${action.color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-auto">
                  {action.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-full">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${activity.color} bg-opacity-10 flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-full">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Completed Tasks
                </span>
              </div>
              <span className="text-lg font-bold text-green-600 flex-shrink-0">24</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Pending Tasks
                </span>
              </div>
              <span className="text-lg font-bold text-yellow-600 flex-shrink-0">8</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <Users className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Active Members
                </span>
              </div>
              <span className="text-lg font-bold text-blue-600 flex-shrink-0">186</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <Calendar className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  This Week
                </span>
              </div>
              <span className="text-lg font-bold text-purple-600 flex-shrink-0">3 events</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Quick Links */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-primary-600 to-gold-600 p-6 rounded-lg text-white">
          <h2 className="text-lg font-semibold mb-4">Admin Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/dashboard/admin"
              className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
            >
              <span>Manage Users</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard/sms"
              className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
            >
              <span>Send SMS</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard/department"
              className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
            >
              <span>Departments</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
