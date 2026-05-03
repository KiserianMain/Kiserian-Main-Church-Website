import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicHome from './pages/PublicHome';
import Announcements from './pages/Announcements';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Payments from './pages/payments/Payments';
import PaymentHistory from './pages/payments/PaymentHistory';
import DepartmentDashboard from './pages/department/DepartmentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Profile from './pages/profile/Profile';

// Create a router factory function that accepts darkMode props
export const createAppRouter = (darkMode, setDarkMode) => {
  return createBrowserRouter([
    {
      path: "/",
      element: <PublicLayout darkMode={darkMode} setDarkMode={setDarkMode} />,
      children: [
        {
          index: true,
          element: <PublicHome />
        },
        {
          path: "announcements",
          element: <Announcements />
        }
      ]
    },
    {
      path: "/auth",
      element: <AuthLayout />,
      children: [
        {
          path: "login",
          element: <Login />
        },
        {
          path: "register",
          element: <Register />
        }
      ]
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <DashboardLayout darkMode={darkMode} setDarkMode={setDarkMode} />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard/overview" replace />
        },
        {
          path: "overview",
          element: <Dashboard />
        },
        {
          path: "payments",
          element: <Payments />
        },
        {
          path: "payment-history",
          element: <PaymentHistory />
        },
        {
          path: "profile",
          element: <Profile />
        },
        {
          path: "department/:id",
          element: <DepartmentDashboard />
        },
        {
          path: "admin",
          element: <AdminDashboard />
        }
      ]
    },
    {
      path: "*",
      element: <Navigate to="/" replace />
    }
  ]);
};

export default createAppRouter;
