import { supabase } from "../lib/supabase";

/**
 * Get pairing code from backend
 * @param {string} phoneNumber - Full phone number with country code
 * @param {boolean} isUpdate - Whether this is an update operation
 * @param {string} [oldNumber] - Old phone number if updating
 * @returns {Promise<string>} Pairing code
 */
export const getPairingCode = async (phoneNumber, isUpdate = false, oldNumber) => {
  const payload = {
    phoneNumber,
    isUpdate,
    ...(oldNumber && { oldNumber }),
  };

  const response = await fetch("/api/whatsapp/pairing-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get pairing code");
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || "Failed to get pairing code");
  }

  return data.data.pairingCode;
};

/**
 * Get all users for current session
 * @returns {Promise<Array>} Array of user objects
 */
export const getUsers = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData?.session) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("createdBy", sessionData.session.user.id);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Insert a new user
 * @param {Object} userData - User data to insert
 * @param {number} userData.contact - Phone number with country code
 * @returns {Promise<Object>} Inserted user data
 */
export const insertUser = async (userData) => {
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData?.session) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("users")
    .insert([{ ...userData, createdBy: sessionData.session.user.id }])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0];
};

/**
 * Update user contact number
 * @param {string} userId - User ID
 * @param {number} newContact - New phone number with country code
 * @returns {Promise<Object>} Updated user data
 */
export const updateUser = async (userId, newContact) => {
  const { data, error } = await supabase
    .from("users")
    .update({ contact: newContact })
    .eq("id", userId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0];
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object
 */
export const getUserById = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, contact")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Check if phone number already exists
 * @param {number} contact - Phone number with country code
 * @returns {Promise<boolean>} True if exists
 */
export const checkPhoneNumberExists = async (contact) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, contact")
    .eq("contact", contact);

  if (error) {
    throw new Error(error.message);
  }

  return data && data.length > 0;
};
