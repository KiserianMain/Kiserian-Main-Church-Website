import { Outlet, Link } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Church, Sun, Moon, Phone, Mail, MapPin, MessageCircle, Share2, Video } from 'lucide-react'

const PublicLayout = ({ toggleDarkMode, isDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="church-gradient text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Church className="h-8 w-8" />
              <span className="font-bold text-xl">SDA Kiserian Main</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="hover:text-blue-200 transition-colors">Home</Link>
              <Link to="/announcements" className="hover:text-blue-200 transition-colors">Announcements</Link>
              <Link to="/auth/login" className="hover:text-blue-200 transition-colors">Member Login</Link>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/20">
              <nav className="flex flex-col space-y-3">
                <Link to="/" className="hover:text-blue-200 transition-colors">Home</Link>
                <Link to="/announcements" className="hover:text-blue-200 transition-colors">Announcements</Link>
                <Link to="/auth/login" className="hover:text-blue-200 transition-colors">Member Login</Link>
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors w-fit"
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Church Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Church className="h-6 w-6" />
                <span className="font-bold text-lg">SDA Kiserian Main</span>
              </div>
              <p className="text-gray-300 text-sm">
                Seventh-day Adventist Church Kiserian Main - Serving the community with love and faith.
              </p>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+254 700 000 000</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>info@sda-kiserian.org</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Kiserian, Kenya</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <Link to="/announcements" className="block text-gray-300 hover:text-white transition-colors">
                  Announcements
                </Link>
                <Link to="/auth/login" className="block text-gray-300 hover:text-white transition-colors">
                  Member Portal
                </Link>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                  Live Stream
                </a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                  Sermons
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                  <Share2 className="h-5 w-5" />
                </a>
                <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                  <Video className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 SDA Church Kiserian Main. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
