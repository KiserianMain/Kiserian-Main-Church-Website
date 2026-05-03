import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Calendar, Users, Heart, Church, ArrowRight, Play, BookOpen, Mail } from 'lucide-react'

const PublicHome = () => {
  const [featuredAnnouncements, setFeaturedAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/announcements/public?limit=3`)
        const data = await response.json()
        setFeaturedAnnouncements(data.announcements || [])
      } catch (error) {
        console.error('Failed to fetch announcements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const serviceTimes = [
    { day: 'Sabbath School', time: '9:00 AM - 10:00 AM' },
    { day: 'Main Service', time: '10:30 AM - 12:30 PM' },
    { day: 'Afternoon Service', time: '2:30 PM - 4:00 PM' },
    { day: 'Prayer Meeting', time: 'Wednesday 6:00 PM - 7:30 PM' }
  ]

  const ministries = [
    { name: 'Sabbath School', icon: BookOpen, description: 'Bible study and spiritual growth for all ages' },
    { name: 'Youth Ministry', icon: Users, description: 'Engaging programs for young adults and youth' },
    { name: 'Health Ministries', icon: Heart, description: 'Health education and community wellness' },
    { name: 'Family Life', icon: Users, description: 'Strengthening families through faith' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="church-gradient text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Welcome to SDA Church Kiserian Main
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Join us for worship, fellowship, and spiritual growth
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/announcements"
                className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100"
              >
                View Announcements
              </Link>
              <Link
                to="/auth/login"
                className="btn btn-lg border-2 border-white text-white hover:bg-white hover:text-primary-600"
              >
                Member Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Service Times */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Service Times
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceTimes.map((service, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-4 text-primary-600" />
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                  {service.day}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{service.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Announcements */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Latest Announcements
            </h2>
            <Link
              to="/announcements"
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="loading-spinner mx-auto"></div>
            </div>
          ) : featuredAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredAnnouncements.map((announcement) => (
                <div key={announcement.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`badge ${
                      announcement.priority === 'urgent' ? 'badge-error' :
                      announcement.priority === 'high' ? 'badge-warning' :
                      announcement.priority === 'low' ? 'badge-secondary' :
                      'badge-primary'
                    }`}>
                      {announcement.priority}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                    {announcement.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {announcement.content}
                  </p>
                  <Link
                    to={`/announcements/${announcement.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Read more →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No announcements available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Ministries */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Our Ministries
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ministries.map((ministry, index) => {
              const Icon = ministry.icon
              return (
                <div key={index} className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-lg transition-shadow">
                  <Icon className="h-12 w-12 mx-auto mb-4 text-primary-600" />
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                    {ministry.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {ministry.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Live Stream Section */}
      <section className="py-16 church-gradient text-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Join Our Live Stream</h2>
            <p className="text-xl mb-8 text-blue-100">
              Can't make it to church? Join us online for our live services
            </p>
            <button className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100 flex items-center space-x-2 mx-auto">
              <Play className="h-5 w-5" />
              <span>Watch Live</span>
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-primary-600" />
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Stay Connected
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Subscribe to our newsletter to receive weekly updates and announcements
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="input flex-1"
                required
              />
              <button type="submit" className="btn btn-primary">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PublicHome
