import { supabase } from "../lib/supabase";

/**
 * Get API keys for current user
 * @returns {Promise<Array>} Array of API key objects
 */
export const getApiKeys = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData?.session) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("api_key")
    .select()
    .eq("createdBy", sessionData.session.user.id);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Insert new API keys
 * @param {Object} apiKeys
 * @param {string} [apiKeys.openai_api]
 * @param {string} [apiKeys.cloudflare_api]
 * @param {string} [apiKeys.gemini_api]
 * @returns {Promise<Object>} Inserted API key data
 */
export const insertApiKeys = async (apiKeys) => {
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData?.session) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("api_key")
    .insert([{
      ...apiKeys,
      createdBy: sessionData.session.user.id,
    }])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0];
};

/**
 * Update API keys
 * @param {Object} apiKeys
 * @param {string} [apiKeys.openai_api]
 * @param {string} [apiKeys.cloudflare_api]
 * @param {string} [apiKeys.gemini_api]
 * @returns {Promise<Object>} Updated API key data
 */
export const updateApiKeys = async (apiKeys) => {
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData?.session) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("api_key")
    .update(apiKeys)
    .eq("createdBy", sessionData.session.user.id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0];
};
