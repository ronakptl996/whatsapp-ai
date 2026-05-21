import { supabase } from "../lib/supabase";

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} Session data
 */
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Sign up with email, password and optional metadata
 * @param {string} email
 * @param {string} password
 * @param {Object} [options]
 * @param {string} [options.name] - User's name
 * @param {string} [options.emailRedirectTo] - Redirect URL after email verification
 * @returns {Promise<Object>} Signup data
 */
export const signup = async (email, password, options = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: options.name || "",
      },
      emailRedirectTo: options.emailRedirectTo || window.location.origin + "/setup-api",
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Verify OTP
 * @param {string} email
 * @param {string} token
 * @returns {Promise<Object>} Verified session
 */
export const verifyOTP = async (email, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Logout current user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
};

/**
 * Get current session
 * @returns {Promise<Object|null>} Session or null
 */
export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

/**
 * Get current user
 * @returns {Promise<Object|null>} User or null
 */
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

/**
 * Reset password
 * @param {string} email
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/reset-password",
  });

  if (error) {
    throw error;
  }
};

/**
 * Update password
 * @param {string} newPassword
 * @returns {Promise<Object>} Updated user
 */
export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Listen to auth state changes
 * @param {Function} callback - Callback function
 * @returns {Object} Subscription object (call .unsubscribe to clean up)
 */
export const onAuthStateChange = (callback) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return data.subscription;
};
