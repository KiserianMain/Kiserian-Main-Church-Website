import { Outlet } from 'react-router-dom'
import { Church } from 'lucide-react'

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 church-gradient items-center justify-center p-12">
          <div className="max-w-md text-center text-white">
            <div className="flex justify-center mb-8">
              <Church className="h-16 w-16" />
            </div>
            <h1 className="text-4xl font-bold mb-6">
              SDA Church Kiserian Main
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Welcome to our digital community platform
            </p>
            <div className="space-y-4 text-left bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Access member-only announcements</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Make secure online payments</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Connect with your departments</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Manage church activities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
