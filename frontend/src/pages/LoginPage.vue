<script setup>
import { reactive, ref } from "vue";
import { useAuth } from "../composables/useAuth";
import { RouterLink } from "vue-router";

const { login, loading } = useAuth();

const formData = reactive({
  email: "",
  password: "",
});

const showPassword = ref(false);

const handleSubmit = async () => {
  if (!formData.email || !formData.password) {
    return;
  }

  try {
    await login(formData.email, formData.password);
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
      <form class="space-y-6" action="#" @submit.prevent="handleSubmit">
        <h5 class="text-xl font-medium text-white">Sign in to our platform</h5>
        
        <div>
          <label for="email" class="block mb-2 text-sm text-white">Email</label>
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
          <label for="password" class="block mb-2 text-sm text-white">Password</label>
          <div class="relative">
            <input
              :type="showPassword ? 'text' : 'password'"
              name="password"
              class="border text-sm rounded-lg outline-none focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
              placeholder="Enter your Password"
              v-model="formData.password"
              required
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
        </div>

        <button
          type="submit"
          class="w-full text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign in</span>
        </button>
        
        <span class="text-sm block text-center text-slate-300">
          Don't have an account?
          <RouterLink to="/signup" class="underline decoration-slate-50">Register</RouterLink>
        </span>
      </form>
    </div>
  </section>
</template>
