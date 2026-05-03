import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, User, Tag, ArrowLeft, Search, Filter } from 'lucide-react'

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchAnnouncements()
  }, [currentPage, priorityFilter])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      let url = `${import.meta.env.VITE_API_URL}/announcements?page=${currentPage}&limit=12`
      if (priorityFilter) {
        url += `&priority=${priorityFilter}`
      }

      const response = await fetch(url)
      const data = await response.json()
      
      setAnnouncements(data.announcements || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'badge-error'
      case 'high': return 'badge-warning'
      case 'low': return 'badge-secondary'
      default: return 'badge-primary'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Church Announcements
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Stay updated with the latest news and events
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input pl-10 appearance-none"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 self-center">
              {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Announcements Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements.map((announcement) => (
              <div key={announcement.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`badge ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(announcement.created_at)}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white line-clamp-2">
                    {announcement.title}
                  </h3>

                  {/* Content */}
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {announcement.content}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      <span>
                        {announcement.first_name} {announcement.last_name}
                      </span>
                    </div>
                    
                    {announcement.department_name && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                        <Tag className="h-4 w-4" />
                        <span>{announcement.department_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No announcements found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || priorityFilter 
                ? 'Try adjusting your filters or search terms'
                : 'Check back later for new announcements'
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline btn-sm"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-outline btn-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Announcements
