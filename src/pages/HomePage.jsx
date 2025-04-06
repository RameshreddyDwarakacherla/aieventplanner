import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SecurityIcon from '@mui/icons-material/Security';

const HomePage = () => {
  const { user, userRole } = useAuth();

  return (
    <div className="w-full px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to EventMaster</h1>
        <p className="text-xl mb-6">Your all-in-one platform for planning and managing events</p>

        {!user ? (
          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <Link
            to={`/dashboard/${localStorage.getItem('userRole') || userRole || 'user'}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
          >
            Go to Dashboard
          </Link>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-3">Plan Your Events</h2>
          <p className="mb-4">Create and manage your events with our intuitive tools. Track budgets, manage guest lists, and more.</p>
          <Link to="/events/create" className="text-blue-600 hover:text-blue-800 font-medium">Start Planning →</Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-3">Find Vendors</h2>
          <p className="mb-4">Discover and connect with top-rated vendors for your events. Compare services and read reviews.</p>
          <Link to="/vendors" className="text-blue-600 hover:text-blue-800 font-medium">Browse Vendors →</Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-3">Manage Guests</h2>
          <p className="mb-4">Send invitations, track RSVPs, and manage your guest list all in one place.</p>
          <Link to="/dashboard/user" className="text-blue-600 hover:text-blue-800 font-medium">Manage Guests →</Link>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Why Choose EventMaster?</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4">
            <div className="bg-blue-100 w-12 h-12 mx-auto rounded-full mb-4 flex items-center justify-center">
              <TouchAppIcon sx={{ fontSize: 28, color: '#3b82f6' }} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
            <p>Intuitive interface designed for both beginners and professionals</p>
          </div>

          <div className="text-center p-4">
            <div className="bg-blue-100 w-12 h-12 mx-auto rounded-full mb-4 flex items-center justify-center">
              <AllInclusiveIcon sx={{ fontSize: 28, color: '#3b82f6' }} />
            </div>
            <h3 className="text-xl font-semibold mb-2">All-in-One Solution</h3>
            <p>Everything you need to plan and manage your events in one platform</p>
          </div>

          <div className="text-center p-4">
            <div className="bg-blue-100 w-12 h-12 mx-auto rounded-full mb-4 flex items-center justify-center">
              <StorefrontIcon sx={{ fontSize: 28, color: '#3b82f6' }} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Vendor Network</h3>
            <p>Connect with trusted vendors who can bring your vision to life</p>
          </div>

          <div className="text-center p-4">
            <div className="bg-blue-100 w-12 h-12 mx-auto rounded-full mb-4 flex items-center justify-center">
              <SecurityIcon sx={{ fontSize: 28, color: '#3b82f6' }} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
            <p>Your data is protected with enterprise-grade security</p>
          </div>
        </div>
      </section>

      <section className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
        <p className="text-xl mb-8">Join thousands of event planners who trust EventMaster</p>

        {!user ? (
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300"
          >
            Create Your Free Account
          </Link>
        ) : (
          <Link
            to={`/dashboard/${localStorage.getItem('userRole') || userRole || 'user'}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300"
          >
            Go to Dashboard
          </Link>
        )}
      </section>
    </div>
  );
};

export default HomePage;