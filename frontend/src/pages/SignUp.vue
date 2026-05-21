<script setup>
import { reactive, ref } from "vue";
import { useAuth } from "../composables/useAuth";
import { RouterLink } from "vue-router";

const { signup, verifyOTP, loading } = useAuth();

const formData = reactive({
  email: "",
  password: "",
  name: "",
  verifyOTP: false,
  otp: "",
});

const showPassword = ref(false);

const handleSubmit = async () => {
  if (!formData.email || !formData.password || !formData.name) {
    return;
  }

  if (formData.password.length < 6) {
    return;
  }

  try {
    const data = await signup(formData.email, formData.password, formData.name);
    
    // If email verification is required
    if (data?.user && !data.user.email_confirmed_at) {
      formData.verifyOTP = true;
    }
  } catch (error) {
    // Error handled in composable
  }
};

const handleOTPVerification = async () => {
  if (!formData.otp) {
    return;
  }

  try {
    await verifyOTP(formData.email, formData.otp);
  } catch (error) {
    // Error handled in composable
  }
};
</script>

<template>
  <section class="grid place-items-center min-h-screen">
    <div
      class="w-full max-w-sm p-4 border rounded-lg shadow sm:p-6 md:p-8 bg-gray-800 border-gray-700"
    >
      <!-- Registration Form -->
      <form
        v-if="!formData.verifyOTP"
        class="space-y-6"
        action="#"
        @submit.prevent="handleSubmit"
      >
        <h5 class="text-xl font-medium text-white">Sign up to our platform</h5>
        
        <div>
          <label for="name" class="block mb-2 text-sm font-medium text-white">Name</label>
          <input
            type="text"
            name="name"
            class="border text-sm rounded-lg outline-none focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
            placeholder="Enter your name"
            v-model="formData.name"
            required
            :disabled="loading"
          />
        </div>
        
        <div>
          <label for="email" class="block mb-2 text-sm font-medium text-white">Email</label>
          <input
            type="email"
            name="email"
            class="border text-sm rounded-lg block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter your Email"
            v-model="formData.email"
            required
            :disabled="loading"
          />
        </div>

        <div>
          <label for="password" class="block mb-2 text-sm font-medium text-white">Password</label>
          <div class="relative">
            <input
              :type="showPassword ? 'text' : 'password'"
              name="password"
              class="border text-sm rounded-lg outline-none focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
              placeholder="Enter your Password"
              v-model="formData.password"
              required
              minlength="6"
              :disabled="loading"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <p class="text-xs text-gray-400 mt-1">Password must be at least 6 characters</p>
        </div>

        <button
          type="submit"
          class="w-full text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          <span v-if="loading">Signing up...</span>
          <span v-else>Sign Up</span>
        </button>
        
        <span class="text-sm block text-center text-slate-300">
          Already have an account?
          <RouterLink to="/login" class="underline decoration-slate-50">Sign in</RouterLink>
        </span>
      </form>

      <!-- OTP Verification Form -->
      <form v-else @submit.prevent="handleOTPVerification">
        <div class="text-center">
          <h5 class="text-xl font-medium text-white">Verify your OTP</h5>
          <p class="text-sm text-gray-400 mt-1">We sent an OTP to your email</p>
        </div>
        
        <div class="mt-5">
          <input
            type="text"
            name="otp"
            class="border text-sm rounded-lg outline-none focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
            placeholder="Enter OTP"
            v-model="formData.otp"
            required
            :disabled="loading"
          />
        </div>
        
        <button
          type="submit"
          class="w-full text-white mt-3 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          <span v-if="loading">Verifying...</span>
          <span v-else>Verify</span>
        </button>
        
        <p class="text-xs text-gray-400 mt-3 text-center">
          Didn't receive OTP? Check your spam folder
        </p>
      </form>
    </div>
  </section>
</template>
