import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";
import * as authServices from "../services/auth";

// Global reactive state
const user = ref(null);
const loading = ref(false);
const initialized = ref(false);

/**
 * Composable for authentication
 * Provides reactive auth state and common auth operations
 */
export function useAuth() {
  const router = useRouter();
  const $toast = useToast();

  /**
   * Initialize auth state on component mount
   */
  const initAuth = async () => {
    try {
      loading.value = true;
      const session = await authServices.getSession();
      user.value = session?.user || null;
    } catch (error) {
      user.value = null;
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  };

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    try {
      loading.value = true;
      const data = await authServices.login(email, password);
      user.value = data.user;
      
      $toast.success("Logged in successfully!", {
        position: "top-right",
      });
      
      router.push({ name: "Home" });
      return data;
    } catch (error) {
      $toast.error(error.message || "Login failed", {
        position: "top-right",
      });
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Sign up with email and password
   */
  const signup = async (email, password, name) => {
    try {
      loading.value = true;
      const emailRedirectTo = import.meta.env.VITE_FRONTEND_URL 
        ? `${import.meta.env.VITE_FRONTEND_URL}/setup-api`
        : `${window.location.origin}/setup-api`;

      const data = await authServices.signup(email, password, {
        name,
        emailRedirectTo,
      });
      
      user.value = data.user;
      
      $toast.success("Registered successfully! Please check your email for verification.", {
        position: "top-right",
      });
      
      return data;
    } catch (error) {
      $toast.error(error.message || "Signup failed", {
        position: "top-right",
      });
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Verify OTP
   */
  const verifyOTP = async (email, token) => {
    try {
      loading.value = true;
      const data = await authServices.verifyOTP(email, token);
      user.value = data.user;
      
      $toast.success("Email verified successfully!", {
        position: "top-right",
      });
      
      router.push({ name: "Setup API" });
      return data;
    } catch (error) {
      $toast.error(error.message || "Verification failed", {
        position: "top-right",
      });
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    try {
      loading.value = true;
      await authServices.logout();
      user.value = null;
      
      $toast.success("Logged out successfully!", {
        position: "top-right",
      });
      
      router.push({ name: "Login" });
    } catch (error) {
      $toast.error(error.message || "Logout failed", {
        position: "top-right",
      });
      // Still redirect to login even if signOut fails
      router.push({ name: "Login" });
    } finally {
      loading.value = false;
    }
  };

  /**
   * Reset password
   */
  const resetPassword = async (email) => {
    try {
      loading.value = true;
      await authServices.resetPassword(email);
      
      $toast.success("Password reset email sent! Check your inbox.", {
        position: "top-right",
      });
    } catch (error) {
      $toast.error(error.message || "Failed to send reset email", {
        position: "top-right",
      });
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => {
    return !!user.value;
  };

  // Set up auth state listener
  let authSubscription = null;

  onMounted(() => {
    initAuth();

    // Listen for auth state changes
    authSubscription = authServices.onAuthStateChange((_event, session) => {
      user.value = session?.user || null;
    });
  });

  onUnmounted(() => {
    if (authSubscription) {
      authSubscription.unsubscribe();
    }
  });

  return {
    // State
    user,
    loading,
    initialized,
    
    // Methods
    login,
    signup,
    verifyOTP,
    logout,
    resetPassword,
    isAuthenticated,
    initAuth,
  };
}
