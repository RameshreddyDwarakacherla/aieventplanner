import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalBookings: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'user');

      if (usersError) throw usersError;

      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'vendor');

      if (vendorsError) throw vendorsError;

      // Fetch bookings with related data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (*),
          users (*)
        `);

      if (bookingsError) throw bookingsError;

      // Calculate total revenue
      const totalRevenue = bookingsData
        ? bookingsData.reduce((sum, booking) => sum + (booking.services?.price || 0), 0)
        : 0;

      setUsers(usersData || []);
      setVendors(vendorsData || []);
      setBookings(bookingsData || []);
      setStats({
        totalUsers: usersData?.length || 0,
        totalVendors: vendorsData?.length || 0,
        totalBookings: bookingsData?.length || 0,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching admin data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error updating user status:', error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Total Users</h3>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Total Vendors</h3>
          <p className="text-2xl font-bold">{stats.totalVendors}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Total Bookings</h3>
          <p className="text-2xl font-bold">{stats.totalBookings}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Users Management Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Users Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...users, ...vendors].map((user) => (
                <tr key={user.id}>
                  <td className="border px-4 py-2">{user.name}</td>
                  <td className="border px-4 py-2">{user.email}</td>
                  <td className="border px-4 py-2">
                    <span className={`px-2 py-1 rounded ${user.role === 'vendor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="border px-4 py-2">
                    <span className={`px-2 py-1 rounded ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => handleStatusChange(user.id, !user.is_active)}
                      className={`px-3 py-1 rounded ${user.is_active ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Bookings Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Service</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Vendor</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="border px-4 py-2">{booking.services.name}</td>
                  <td className="border px-4 py-2">{booking.users.name}</td>
                  <td className="border px-4 py-2">{booking.services.vendor_name}</td>
                  <td className="border px-4 py-2">
                    {new Date(booking.booking_date).toLocaleDateString()}
                  </td>
                  <td className="border px-4 py-2">
                    <span className={`px-2 py-1 rounded ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;