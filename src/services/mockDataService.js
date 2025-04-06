// This service provides mock data when the real database tables don't exist yet
// It stores data in localStorage to persist between sessions

// Helper function to get data from localStorage with a default value
const getLocalData = (key, defaultValue) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper function to save data to localStorage
const saveLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
};

// Mock profiles data
export const getProfiles = () => {
  // Get existing profiles or initialize with default admin user
  const profiles = getLocalData('mockProfiles', []);

  // Check if admin profile exists
  const adminExists = profiles.some(profile =>
    profile.email === 'admin@ai.com' && profile.role === 'admin'
  );

  // If admin doesn't exist, add it
  if (!adminExists) {
    const adminProfile = {
      id: 'admin-mock-id',
      email: 'admin@ai.com',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    profiles.push(adminProfile);
    saveLocalData('mockProfiles', profiles);
    console.log('Added mock admin profile:', adminProfile);
  }

  return profiles;
};

export const getProfileByEmail = (email) => {
  const profiles = getProfiles();
  return profiles.find(profile => profile.email === email) || null;
};

export const getProfileById = (id) => {
  const profiles = getProfiles();
  return profiles.find(profile => profile.id === id) || null;
};

export const createProfile = (profile) => {
  const profiles = getProfiles();

  // Check if profile with this email already exists
  const existingProfile = profiles.find(p => p.email === profile.email);
  if (existingProfile) {
    return { error: 'Profile with this email already exists' };
  }

  // Add the new profile
  profiles.push(profile);
  saveLocalData('mockProfiles', profiles);

  return { data: profile };
};

export const updateProfile = (id, updates) => {
  const profiles = getProfiles();
  const index = profiles.findIndex(profile => profile.id === id);

  if (index === -1) {
    return { error: 'Profile not found' };
  }

  // Update the profile
  profiles[index] = { ...profiles[index], ...updates, updated_at: new Date().toISOString() };
  saveLocalData('mockProfiles', profiles);

  return { data: profiles[index] };
};

// Mock vendors data
export const getVendors = () => {
  return getLocalData('mockVendors', []);
};

export const getVendorByUserId = (userId) => {
  const vendors = getVendors();
  return vendors.find(vendor => vendor.user_id === userId) || null;
};

export const createVendor = (vendor) => {
  const vendors = getVendors();

  // Check if vendor with this user_id already exists
  const existingVendor = vendors.find(v => v.user_id === vendor.user_id);
  if (existingVendor) {
    return { error: 'Vendor with this user_id already exists' };
  }

  // Add the new vendor
  vendors.push(vendor);
  saveLocalData('mockVendors', vendors);

  return { data: vendor };
};

export const updateVendor = (id, updates) => {
  const vendors = getVendors();
  const index = vendors.findIndex(vendor => vendor.id === id);

  if (index === -1) {
    return { error: 'Vendor not found' };
  }

  // Update the vendor
  vendors[index] = { ...vendors[index], ...updates, updated_at: new Date().toISOString() };
  saveLocalData('mockVendors', vendors);

  return { data: vendors[index] };
};

// Mock events data
export const getEvents = () => {
  return getLocalData('mockEvents', []);
};

export const getEventsByUserId = (userId) => {
  const events = getEvents();
  return events.filter(event => event.user_id === userId);
};

export const createEvent = (event) => {
  const events = getEvents();
  events.push(event);
  saveLocalData('mockEvents', events);

  return { data: event };
};

// Clear all mock data (for testing)
export const clearAllMockData = () => {
  localStorage.removeItem('mockProfiles');
  localStorage.removeItem('mockVendors');
  localStorage.removeItem('mockEvents');
};

export default {
  getProfiles,
  getProfileByEmail,
  getProfileById,
  createProfile,
  updateProfile,
  getVendors,
  getVendorByUserId,
  createVendor,
  updateVendor,
  getEvents,
  getEventsByUserId,
  createEvent,
  clearAllMockData
};
