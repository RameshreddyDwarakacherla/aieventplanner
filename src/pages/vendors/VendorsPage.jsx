import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVendors();
    fetchCategories();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      let query = supabase.from('vendors').select('*');

      // This is a mock implementation - in a real app, you would have actual data
      // For now, we'll simulate vendors with hardcoded data
      const mockVendors = [
        {
          id: 1,
          name: 'Elegant Events Catering',
          category: 'catering',
          description: 'Premium catering services for all types of events',
          rating: 4.8,
          image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033',
          location: 'New York, NY'
        },
        {
          id: 2,
          name: 'Floral Fantasy',
          category: 'decoration',
          description: 'Beautiful floral arrangements and event decorations',
          rating: 4.7,
          image_url: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5',
          location: 'Los Angeles, CA'
        },
        {
          id: 3,
          name: 'Sound Masters',
          category: 'entertainment',
          description: 'Professional DJs and sound equipment for events',
          rating: 4.9,
          image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
          location: 'Chicago, IL'
        },
        {
          id: 4,
          name: 'Perfect Moments Photography',
          category: 'photography',
          description: 'Capturing your special moments with professional photography',
          rating: 4.6,
          image_url: 'https://images.unsplash.com/photo-1554080353-a576cf803bda',
          location: 'Miami, FL'
        },
        {
          id: 5,
          name: 'Divine Venues',
          category: 'venue',
          description: 'Stunning venues for weddings and corporate events',
          rating: 4.5,
          image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3',
          location: 'Dallas, TX'
        },
        {
          id: 6,
          name: 'Sweet Delights Bakery',
          category: 'catering',
          description: 'Custom cakes and desserts for all occasions',
          rating: 4.7,
          image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587',
          location: 'Boston, MA'
        },
      ];

      setVendors(mockVendors);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setLoading(false);
    }
  };

  const fetchCategories = () => {
    // Mock categories
    setCategories([
      { id: 'catering', name: 'Catering' },
      { id: 'decoration', name: 'Decoration' },
      { id: 'entertainment', name: 'Entertainment' },
      { id: 'photography', name: 'Photography' },
      { id: 'venue', name: 'Venues' },
    ]);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesCategory = selectedCategory === 'all' || vendor.category === selectedCategory;
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vendor.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Find the Perfect Vendors for Your Event</h1>

      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="w-full md:w-2/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search vendors..."
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/3">
            <div className="relative">
              <select
                className="w-full p-3 pl-10 appearance-none border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition-all"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-xl">Loading vendors...</p>
        </div>
      ) : filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => (
            <div key={vendor.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 mr-3 font-bold text-xl">
                      {vendor.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">{vendor.name}</h2>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center text-yellow-500 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          <span className="ml-1 font-medium">{vendor.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">({vendor.reviews || 0} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                    {categories.find(c => c.id === vendor.category)?.name || vendor.category}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">{vendor.description}</p>

                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{vendor.location}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">{vendor.years_in_business || '5'} years</span>
                    </div>
                  </div>

                  <Link
                    to={`/vendors/${vendor.id}`}
                    className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors duration-300 font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-100 rounded-lg">
          <p className="text-xl mb-4">No vendors found matching your criteria</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchTerm('');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default VendorsPage;