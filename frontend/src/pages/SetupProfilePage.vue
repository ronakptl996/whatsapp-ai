<script setup>
import { reactive, ref } from "vue";
import { useToast } from "vue-toast-notification";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const $toast = useToast();
const router = useRouter();
const { user } = useAuth();
const loading = ref(false);

const formData = reactive({
  username: "",
  fullname: "",
});

const handleSubmit = async () => {
  if (!formData.username || !formData.fullname) {
    $toast.error("All fields are required!", {
      position: "top-right",
    });
    return;
  }

  try {
    loading.value = true;
    
    // TODO: Add profile update logic here when backend is ready
    // For now, just redirect to setup-api page
    $toast.success("Profile setup feature coming soon!", {
      position: "top-right",
    });
    
    router.push("/setup-api");
  } catch (error) {
    $toast.error(error.message || "Failed to update profile", {
      position: "top-right",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section class="grid place-items-center min-h-screen">
    <div
      class="w-full max-w-sm p-4 border rounded-lg shadow sm:p-6 md:p-8 bg-gray-800 border-gray-700"
    >
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <h5 class="text-xl font-medium text-white">Setup Your Profile</h5>
        
        <div>
          <label for="username" class="block mb-2 text-sm font-medium text-white">Username</label>
          <input
            type="text"
            name="username"
            class="border text-sm rounded-lg outline-none focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
            placeholder="Choose a username"
            v-model="formData.username"
            required
            :disabled="loading"
          />
        </div>
        
        <div>
          <label for="fullname" class="block mb-2 text-sm font-medium text-white">Full Name</label>
          <input
            type="text"
            name="fullname"
            class="border text-sm rounded-lg block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter your full name"
            v-model="formData.fullname"
            required
            :disabled="loading"
          />
        </div>

        <button
          type="submit"
          class="w-full text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          <span v-if="loading">Saving...</span>
          <span v-else>Continue to API Setup</span>
        </button>
        
        <p class="text-xs text-gray-400 text-center">
          Welcome, {{ user?.email }}! Complete your profile to get started.
        </p>
      </form>
    </div>
  </section>
</template>
