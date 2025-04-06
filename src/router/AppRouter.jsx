import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import { useState, useEffect } from 'react';
import { CircularProgress, Typography } from '@mui/material';

// Public Pages
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import EventsPage from '../pages/events/EventsPage';
import VendorsPage from '../pages/vendors/VendorsPage';
import VendorDetailsPage from '../pages/vendors/VendorDetailsPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import FaqPage from '../pages/FaqPage';
import PrivacyPage from '../pages/PrivacyPage';
import TermsPage from '../pages/TermsPage';
import NotFoundPage from '../pages/NotFoundPage';

// User (Event Organizer) Pages
import UserDashboard from '../pages/user/UserDashboard';
import CreateEventPage from '../pages/user/CreateEventPage';
import ManageEventPage from '../pages/user/ManageEventPage';
import EventDetailsPage from '../pages/user/EventDetailsPage';
import BudgetPlannerPage from '../pages/user/BudgetPlannerPage';
import GuestManagementPage from '../pages/user/GuestManagementPage';
import VendorSearchPage from '../pages/user/VendorSearchPage';

// Vendor Pages
import VendorDashboard from '../pages/vendor/VendorDashboard';
import VendorProfilePage from '../pages/vendor/VendorProfilePage';
import VendorServicesPage from '../pages/vendor/VendorServicesPage';
import AddServicePage from '../pages/vendor/AddServicePage';
import VendorBookingsPage from '../pages/vendor/VendorBookingsPage';
import VendorReviewsPage from '../pages/vendor/VendorReviewsPage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageUsersPage from '../pages/admin/ManageUsersPage';
import ManageVendorsPage from '../pages/admin/ManageVendorsPage';
import ManageEventsPage from '../pages/admin/ManageEventsPage';
import SystemSettingsPage from '../pages/admin/SystemSettingsPage';
import DatabaseSetupPage from '../pages/admin/DatabaseSetupPage';

// Shared Pages
import ProfilePage from '../pages/profile/ProfilePage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Dashboard Redirect Component
const DashboardRedirect = () => {
  const { user, userRole, loading } = useAuth();
  const [redirected, setRedirected] = useState(false);

  console.log('DashboardRedirect - User:', user?.id);
  console.log('DashboardRedirect - UserRole:', userRole);
  console.log('DashboardRedirect - Loading:', loading);

  // Get the stored role from localStorage if available
  const storedRole = localStorage.getItem('userRole');

  useEffect(() => {
    // This ensures we only redirect once the userRole is available
    if (user && !loading && !redirected) {
      // Use the stored role from localStorage if available, otherwise use the context role
      const effectiveRole = storedRole || userRole || 'user';
      console.log('Ready to redirect to dashboard for role:', effectiveRole);
      setRedirected(true);
    }
  }, [user, userRole, loading, redirected, storedRole]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading...</Typography>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (redirected) {
    // Use the stored role from localStorage if available, otherwise use the context role
    const effectiveRole = storedRole || userRole || 'user';

    // Redirect based on effective role
    const redirectPath = effectiveRole === 'vendor' ? '/dashboard/vendor' :
                        effectiveRole === 'admin' ? '/dashboard/admin' :
                        '/dashboard/user';

    console.log('Redirecting to:', redirectPath, 'for role:', effectiveRole);

    // Clear the stored role after using it
    if (storedRole) {
      localStorage.removeItem('userRole');
    }

    return <Navigate to={redirectPath} replace />;
  }

  // Show loading while waiting for role to be determined
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ ml: 2 }}>Preparing your dashboard...</Typography>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userRole, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Get the stored role from localStorage if available
  const storedRole = localStorage.getItem('userRole');

  useEffect(() => {
    const checkAuthorization = async () => {
      setIsChecking(true);

      console.log('ProtectedRoute - Checking authorization');
      console.log('ProtectedRoute - User:', user?.id);
      console.log('ProtectedRoute - UserRole from context:', userRole);
      console.log('ProtectedRoute - UserRole from localStorage:', storedRole);
      console.log('ProtectedRoute - AllowedRoles:', allowedRoles);

      // Wait for loading to complete
      if (loading) {
        return;
      }

      // Check if user is logged in
      if (!user) {
        console.log('ProtectedRoute - No user found, not authorized');
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }

      // Use the stored role from localStorage if available, otherwise use the context role
      const effectiveRole = storedRole || userRole || 'user';
      console.log('ProtectedRoute - Effective role:', effectiveRole);

      // Check if user has the required role
      if (allowedRoles) {
        const authorized = allowedRoles.includes(effectiveRole);
        console.log('ProtectedRoute - Is authorized:', authorized);
        setIsAuthorized(authorized);
      } else {
        // Default to authorized if no roles specified
        console.log('ProtectedRoute - No roles specified, authorized by default');
        setIsAuthorized(true);
      }

      setIsChecking(false);
    };

    checkAuthorization();
  }, [user, userRole, loading, allowedRoles, storedRole]);

  if (loading || isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading...</Typography>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    console.log('User not authorized for this route. Role:', userRole, 'Required:', allowedRoles);

    // Use the stored role from localStorage if available, otherwise use the context role
    const effectiveRole = storedRole || userRole || 'user';

    // Redirect to appropriate dashboard based on effective role
    const redirectPath = effectiveRole === 'vendor' ? '/dashboard/vendor' :
                        effectiveRole === 'admin' ? '/dashboard/admin' :
                        '/dashboard/user';

    console.log('Redirecting unauthorized user to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />

        {/* Dashboard Redirect */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Layout><LoginPage /></Layout>} />
        <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
        <Route path="/reset-password" element={<Layout><ResetPasswordPage /></Layout>} />

        {/* Public Routes */}
        <Route path="/events" element={<Layout><EventsPage /></Layout>} />
        <Route path="/vendors" element={<Layout><VendorsPage /></Layout>} />
        <Route path="/vendors/:vendorId" element={<Layout><VendorDetailsPage /></Layout>} />
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
        <Route path="/faq" element={<Layout><FaqPage /></Layout>} />
        <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
        <Route path="/terms" element={<Layout><TermsPage /></Layout>} />

        {/* User (Event Organizer) Routes */}
        <Route path="/dashboard/user" element={
          <ProtectedRoute allowedRoles={['user']}>
            <Layout><UserDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/events/create" element={
          <ProtectedRoute allowedRoles={['user']}>
            <Layout><CreateEventPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/events/:eventId" element={
          <ProtectedRoute allowedRoles={['user']}>
            <Layout><EventDetailsPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/events/:eventId/manage" element={
          <ProtectedRoute allowedRoles={['user']}>
            <Layout><ManageEventPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/events/:eventId/budget" element={
          <ProtectedRoute allowedRoles={['user']}>
            <Layout><BudgetPlannerPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/events/:eventId/guests" element={
          <ProtectedRoute allowedRoles={['user']}>
            <Layout><GuestManagementPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/vendors/search" element={
          <ProtectedRoute allowedRoles={['user']}>
            <Layout><VendorSearchPage /></Layout>
          </ProtectedRoute>
        } />

        {/* Vendor Routes */}
        <Route path="/dashboard/vendor" element={
          <ProtectedRoute allowedRoles={['vendor']}>
            <Layout><VendorDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/vendor/profile" element={
          <ProtectedRoute allowedRoles={['vendor']}>
            <Layout><VendorProfilePage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/vendor/services" element={
          <ProtectedRoute allowedRoles={['vendor']}>
            <Layout><VendorServicesPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/vendor/services/add" element={
          <ProtectedRoute allowedRoles={['vendor']}>
            <Layout><AddServicePage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/vendor/bookings" element={
          <ProtectedRoute allowedRoles={['vendor']}>
            <Layout><VendorBookingsPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/vendor/reviews" element={
          <ProtectedRoute allowedRoles={['vendor']}>
            <Layout><VendorReviewsPage /></Layout>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/dashboard/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout><ManageUsersPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/database-setup" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout><DatabaseSetupPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/vendors" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout><ManageVendorsPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/events" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout><ManageEventsPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout><SystemSettingsPage /></Layout>
          </ProtectedRoute>
        } />

        {/* Shared Routes */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['user', 'vendor', 'admin']}>
            <Layout><ProfilePage /></Layout>
          </ProtectedRoute>
        } />

        {/* 404 Route */}
        <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;