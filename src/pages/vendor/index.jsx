import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const VendorDashboard = () => {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      const user = supabase.auth.user();
      if (!user) return;

      // Fetch vendor's services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('vendor_id', user.id);

      if (servicesError) throw servicesError;

      // Fetch vendor's bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (*),
          users (*)
        `)
        .eq('vendor_id', user.id);

      if (bookingsError) throw bookingsError;

      setServices(servicesData || []);
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error fetching vendor data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Vendor Dashboard</h1>

      {/* Services Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">My Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div key={service.id} className="border p-4 rounded-lg">
              <h3 className="text-xl font-medium">{service.service_name || service.name || service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
              <p className="text-lg font-semibold mt-2">${service.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bookings Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Service</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="border px-4 py-2">{booking.services.name}</td>
                  <td className="border px-4 py-2">{booking.users.name}</td>
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

export default VendorDashboard;