import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-xl text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <Link 
            to="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Go to Homepage
          </Link>
          
          <Link 
            to="/contact" 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Contact Support
          </Link>
        </div>
        
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">You might be looking for:</h3>
          <ul className="flex flex-wrap justify-center gap-4">
            <li>
              <Link to="/events" className="text-blue-600 hover:text-blue-800 hover:underline">Events</Link>
            </li>
            <li>
              <Link to="/vendors" className="text-blue-600 hover:text-blue-800 hover:underline">Vendors</Link>
            </li>
            <li>
              <Link to="/login" className="text-blue-600 hover:text-blue-800 hover:underline">Login</Link>
            </li>
            <li>
              <Link to="/register" className="text-blue-600 hover:text-blue-800 hover:underline">Register</Link>
            </li>
            <li>
              <Link to="/about" className="text-blue-600 hover:text-blue-800 hover:underline">About Us</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;