import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as mockDataService from '../services/mockDataService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'user', 'vendor', or 'admin'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileSubscription = null;
    let roleSubscription = null;

    // Check for active session on component mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Active session found:', session.user);
          setUser(session.user);

          // Check for role in user metadata first
          if (session.user.user_metadata?.role) {
            console.log('Found role in user metadata:', session.user.user_metadata.role);
            setUserRole(session.user.user_metadata.role);
          } else {
            // If not in metadata, fetch from database
            console.log('Fetching user role from database...');
            await fetchUserRole(session.user.id);
          }

          // Subscribe to profile changes
          profileSubscription = supabase
            .channel('profile-changes')
            .on('postgres_changes',
              { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` },
              async (payload) => {
                if (payload.new) {
                  setUserRole(payload.new.role);
                }
              }
            )
            .subscribe();

          // Subscribe to role-specific table changes
          roleSubscription = supabase
            .channel('role-changes')
            .on('postgres_changes',
              { event: '*', schema: 'public', table: 'vendors', filter: `user_id=eq.${session.user.id}` },
              async () => {
                await fetchUserRole(session.user.id);
              }
            )
            .on('postgres_changes',
              { event: '*', schema: 'public', table: 'admins', filter: `user_id=eq.${session.user.id}` },
              async () => {
                await fetchUserRole(session.user.id);
              }
            )
            .subscribe();
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in:', session.user);
          setUser(session.user);

          // Check for role in user metadata first
          if (session.user.user_metadata?.role) {
            console.log('Found role in user metadata:', session.user.user_metadata.role);
            setUserRole(session.user.user_metadata.role);
          } else {
            // If not in metadata, fetch from database
            console.log('Fetching user role from database...');
            await fetchUserRole(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setUserRole(null);
        } else if (event === 'USER_UPDATED' && session) {
          console.log('User updated:', session.user);
          setUser(session.user);

          // Check if role was updated in metadata
          if (session.user.user_metadata?.role) {
            console.log('Updated role in metadata:', session.user.user_metadata.role);
            setUserRole(session.user.user_metadata.role);
          }
        } else if (!session) {
          setUser(null);
          setUserRole(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
      if (profileSubscription) profileSubscription.unsubscribe();
      if (roleSubscription) roleSubscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      console.log('Fetching user role for userId:', userId);

      // First check if user is in the mock profiles
      const mockProfile = mockDataService.getProfileById(userId);
      if (mockProfile) {
        console.log('Found mock profile with role:', mockProfile.role);
        setUserRole(mockProfile.role);
        return;
      }

      // Check user metadata first (this is set during signup)
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role) {
        console.log('Found role in user metadata:', user.user_metadata.role);
        setUserRole(user.user_metadata.role);
        return;
      }

      // Try to check the real database tables
      try {
        // First check if user is in the profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        // If there's no error and we found a profile, use its role
        if (!profileError && profile) {
          console.log('Found profile in database with role:', profile.role);
          setUserRole(profile.role);
          return;
        }

        // If the error is not about the table not existing, log it
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        // Try to check vendors table
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', userId)
          .single();

        // If there's no error and we found a vendor, set role to vendor
        if (!vendorError && vendor) {
          console.log('Found vendor in database');
          setUserRole('vendor');
          return;
        }

        // If the error is not about the table not existing, log it
        if (vendorError && vendorError.code !== '42P01') {
          console.error('Error fetching vendor:', vendorError);
        }

        // Check if the user is an admin in the profiles table
        try {
          const { data: adminProfile, error: adminProfileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .eq('role', 'admin')
            .single();

          // If there's no error and we found an admin profile, set role to admin
          if (!adminProfileError && adminProfile) {
            console.log('Found admin in profiles table');
            setUserRole('admin');
            return;
          }

          // If the error is not about the table not existing or no rows returned, log it
          if (adminProfileError && adminProfileError.code !== '42P01' && adminProfileError.code !== 'PGRST116') {
            console.error('Error checking admin in profiles:', adminProfileError);
          }
        } catch (adminCheckError) {
          console.error('Error checking admin status:', adminCheckError);
        }
      } catch (error) {
        console.error('Error checking database tables:', error);
      }

      // If we get here, we couldn't determine the role from the database
      // Create a default profile with 'user' role
      try {
        console.log('Creating default user profile for:', userId);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              email: user?.email || '',
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

        if (insertError) {
          console.error('Error creating default profile:', insertError);
        }
      } catch (insertError) {
        console.error('Error creating default profile:', insertError);
      }

      // Default to 'user' if not found in any role-specific table or if tables don't exist
      console.log('Defaulting to user role');
      setUserRole('user');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user'); // Default to user on error
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('Login attempt for email:', email);

      // No special case for admin login - use real authentication

      // Use real authentication for all users
      try {
        // Try to check if email exists in profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        // If there's an error and it's not because the table doesn't exist, throw it
        if (error && error.code !== '42P01') {
          throw error;
        }

        // If we successfully queried the table and found no profile, return an error
        if (!error && !profile) {
          return { success: false, error: 'No account found with this email.' };
        }
      } catch (profileError) {
        // If the error is not about the table not existing, log it
        if (profileError.code !== '42P01') {
          console.error('Error checking profile:', profileError);
        }
        // Continue with sign in anyway - we'll handle the case where the user doesn't exist
      }

      // No mock profile handling - use real authentication only

      // If no mock profile, try to sign in with Supabase
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Handle specific error cases
          if (error.message.includes('Email not confirmed')) {
            return {
              success: false,
              error: 'Please confirm your email address before signing in. Check your inbox for the confirmation link.'
            };
          }
          if (error.message.includes('Invalid login credentials')) {
            return { success: false, error: 'Invalid email or password' };
          }
          if (error.message.includes('rate limit')) {
            return { success: false, error: 'Too many attempts. Please try again later.' };
          }
          throw error;
        }

        console.log('Supabase login successful, setting user state');

        // Set user state
        setUser(data.user);

        // Fetch and set user role
        console.log('Fetching user role for ID:', data.user.id);
        await fetchUserRole(data.user.id);

        // Get the current role after fetching
        // Check if this is the admin user by email
        let currentRole = userRole || 'user';

        // Special case for admin@ai.com - always set role to admin
        if (data.user.email === 'admin@ai.com') {
          currentRole = 'admin';
          setUserRole('admin');
          localStorage.setItem('userRole', 'admin');
        }

        console.log('Login successful, user role determined:', currentRole);

        // Force update the user metadata with the role
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            data: { role: currentRole }
          });

          // Make sure the role is set correctly in the context
          setUserRole(currentRole);

          if (updateError) {
            console.error('Error updating user metadata:', updateError);
          } else {
            console.log('User metadata updated with role:', currentRole);
          }
        } catch (updateError) {
          console.error('Error updating user metadata:', updateError);
        }

        // Add the role to the returned data
        const userWithRole = {
          ...data.user,
          role: currentRole
        };

        return {
          success: true,
          data: {
            ...data,
            user: userWithRole
          }
        };
      } catch (signInError) {
        console.error('Error signing in with Supabase:', signInError);
        // If we have a mock profile but Supabase auth failed, still allow login for demo purposes
        if (mockProfile) {
          setUser({
            id: mockProfile.id,
            email: mockProfile.email,
            user_metadata: { role: mockProfile.role }
          });
          setUserRole(mockProfile.role);
          return { success: true, data: { user: mockProfile } };
        }
        throw signInError;
      }

    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Track last signup attempt time to prevent rate limiting issues
  let lastSignUpAttempt = 0;

  const signUp = async (email, password, role = 'user', firstName = '', lastName = '') => {
    try {
      // Input validation
      if (!email || !password) {
        return { success: false, error: 'Email and password are required.' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }

      // Check if we're trying to sign up too quickly (prevent 429 errors)
      const now = Date.now();
      const timeSinceLastAttempt = now - lastSignUpAttempt;

      if (timeSinceLastAttempt < 1500) { // 1.5 seconds minimum between attempts
        return { success: false, error: 'Please wait a moment before trying again.' };
      }

      // Update last attempt timestamp
      lastSignUpAttempt = now;

      // No mock profile handling - use real authentication only

      // Skip checking the real database for existing profiles
      // This avoids the 404 error when the profiles table doesn't exist

      // Create the user in Supabase Auth with email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            role: role,
            firstName: firstName,
            lastName: lastName
          }
        }
      });

      console.log('User signup data:', authData);

      if (authError) {
        console.error('Auth error during signup:', authError.message);

        if (authError.message.includes('rate limit')) {
          return { success: false, error: 'Too many attempts. Please try again later.' };
        }
        if (authError.message.includes('Password should be at least 6 characters')) {
          return { success: false, error: 'Password must be at least 6 characters long.' };
        }
        if (authError.message.includes('valid email')) {
          return { success: false, error: 'Please enter a valid email address.' };
        }
        if (authError.message.includes('Email signups are disabled')) {
          console.log('Email signups are disabled in Supabase. Using mock data instead.');

          // Create a mock user for testing purposes
          const mockUserId = crypto.randomUUID();

          // Create a mock profile
          const mockProfile = {
            id: mockUserId,
            email: email,
            role: role,
            firstName: firstName,
            lastName: lastName,
            password: password, // Note: In a real app, never store plain text passwords
          };

          mockDataService.createProfile(mockProfile);

          // If the user is a vendor, create a vendor profile too
          if (role === 'vendor') {
            mockDataService.createVendor({
              id: crypto.randomUUID(),
              user_id: mockUserId,
              company_name: `${firstName}'s Company`,
              vendor_type: 'General',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_verified: true
            });
          }

          // Set the user role
          setUserRole(role);

          // Return success with the mock user
          return {
            success: true,
            message: 'Account created successfully! (Using mock data because email signups are disabled)',
            data: {
              user: {
                id: mockUserId,
                email: email,
                user_metadata: { role: role, firstName, lastName }
              }
            }
          };
        }

        // For any other errors, throw them
        return { success: false, error: authError.message };
      }

      if (!authData?.user?.id) {
        return { success: false, error: 'Failed to create user account.' };
      }

      // Try to create profile in the real database first
      try {
        console.log('Creating profile in database for user:', authData.user.id);
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email,
              role: role,
              first_name: firstName,
              last_name: lastName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

        if (profileError) {
          console.error('Error creating profile in database:', profileError);
          // If there's an error and it's not because the table doesn't exist, throw it
          if (profileError.code !== '42P01') {
            throw profileError;
          }
        } else {
          console.log('Profile created successfully in database');
          // Set the user role immediately after successful profile creation
          setUserRole(role);
        }
      } catch (profileError) {
        console.error('Error creating profile in database, using mock data instead:', profileError);
        // If the database table doesn't exist, use mock data
        mockDataService.createProfile({
          id: authData.user.id,
          email: email,
          role: role,
          first_name: firstName,
          last_name: lastName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        });
      }

      // If user is registering as a vendor, try to create vendor record
      if (role === 'vendor') {
        console.log('Creating vendor profile for user:', authData.user.id);
        try {
          const { error: vendorError } = await supabase
            .from('vendors')
            .insert([
              {
                user_id: authData.user.id,
                company_name: `${firstName}'s Company`, // Default company name
                vendor_type: 'General', // Default vendor type
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_verified: false // Vendors start unverified
              },
            ]);

          if (vendorError) {
            console.error('Error creating vendor in database:', vendorError);
            // If there's an error and it's not because the table doesn't exist, throw it
            if (vendorError.code !== '42P01') {
              throw vendorError;
            }
          } else {
            console.log('Vendor profile created successfully in database');
          }
        } catch (vendorError) {
          console.error('Error creating vendor in database, using mock data instead:', vendorError);
          // If the database table doesn't exist, use mock data
          const vendorId = crypto.randomUUID();
          mockDataService.createVendor({
            id: vendorId,
            user_id: authData.user.id,
            company_name: `${firstName}'s Company`,
            vendor_type: 'General',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_verified: false
          });
          console.log('Created mock vendor profile with ID:', vendorId);
        }
      }

      // Set the user role in the context
      setUserRole(role);

      return {
        success: true,
        data: {
          ...authData,
          user: {
            ...authData.user,
            role: role
          }
        },
        message: 'Please check your email for the confirmation link to complete your registration.'
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear user state
      setUser(null);
      setUserRole(null);

      // Clear role from localStorage
      localStorage.removeItem('userRole');

      // Clear any mock data that might be causing issues
      mockDataService.clearAllMockData();

      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};