<script setup>
import { onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { useToast } from "vue-toast-notification";
import * as apiKeysServices from "../services/apiKeys";

const $toast = useToast();
const loading = ref(false);

const formData = reactive({
  openai_api: "",
  cloudflare_api: "",
  gemini_api: "",
  is_update: false,
});

const handleUpdate = async () => {
  try {
    loading.value = true;
    
    const updatedData = await apiKeysServices.updateApiKeys({
      gemini_api: formData.gemini_api,
      openai_api: formData.openai_api,
      cloudflare_api: formData.cloudflare_api,
    });

    formData.cloudflare_api = updatedData.cloudflare_api;
    formData.gemini_api = updatedData.gemini_api;
    formData.openai_api = updatedData.openai_api;
    
    $toast.success("API keys updated successfully!", {
      position: "top-right",
    });
  } catch (error) {
    $toast.error(error.message || "Failed to update API keys", {
      position: "top-right",
    });
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  try {
    loading.value = true;
    
    const insertData = await apiKeysServices.insertApiKeys({
      gemini_api: formData.gemini_api,
      openai_api: formData.openai_api,
      cloudflare_api: formData.cloudflare_api,
    });

    formData.cloudflare_api = insertData.cloudflare_api;
    formData.gemini_api = insertData.gemini_api;
    formData.openai_api = insertData.openai_api;
    formData.is_update = true;
    
    $toast.success("API keys added successfully!", {
      position: "top-right",
    });
  } catch (error) {
    $toast.error(error.message || "Failed to add API keys", {
      position: "top-right",
    });
  } finally {
    loading.value = false;
  }
};

const fetchData = async () => {
  try {
    const userApi = await apiKeysServices.getApiKeys();

    if (userApi.length > 0) {
      formData.cloudflare_api = userApi[0].cloudflare_api;
      formData.gemini_api = userApi[0].gemini_api;
      formData.openai_api = userApi[0].openai_api;
      formData.is_update = true;
    }
  } catch (error) {
    if (error.message !== "User not authenticated") {
      $toast.error(error.message || "Failed to fetch API keys", {
        position: "top-right",
      });
    }
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <section class="grid place-items-center min-h-screen">
    <div
      class="w-full max-w-sm p-4 border rounded-lg shadow sm:p-6 md:p-8 bg-gray-800 border-gray-700"
    >
      <form class="space-y-6" @submit.prevent>
        <h5 class="text-xl font-medium text-white">Setup your API Keys</h5>
        
        <div>
          <label for="openaiapi" class="block mb-2 text-sm font-medium text-white">OpenAI API</label>
          <input
            type="password"
            name="openaiapi"
            class="border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
            placeholder="Enter your OpenAI API key"
            v-model="formData.openai_api"
            :disabled="loading"
          />
        </div>
        
        <div>
          <label for="cloudflareapi" class="block mb-2 text-sm font-medium text-white">Cloudflare API</label>
          <input
            type="password"
            name="cloudflareapi"
            class="border text-sm rounded-lg block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your Cloudflare API key"
            v-model="formData.cloudflare_api"
            :disabled="loading"
          />
        </div>
        
        <div>
          <label for="geminiapi" class="block mb-2 text-sm font-medium text-white">Gemini API</label>
          <input
            type="password"
            name="geminiapi"
            class="border text-sm rounded-lg block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your Gemini API key"
            v-model="formData.gemini_api"
            :disabled="loading"
          />
        </div>

        <div class="flex justify-end gap-2">
          <button
            v-if="formData.is_update"
            type="button"
            class="text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleUpdate"
            :disabled="loading"
          >
            <span v-if="loading">Updating...</span>
            <span v-else>Update</span>
          </button>
          
          <button
            v-else
            type="button"
            class="text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleSubmit"
            :disabled="loading"
          >
            <span v-if="loading">Submitting...</span>
            <span v-else>Submit</span>
          </button>
          
          <RouterLink
            to="/"
            class="bg-slate-300 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 hover:bg-slate-500 focus:ring-slate-400 hover:text-white"
          >
            Skip
          </RouterLink>
        </div>
      </form>
    </div>
  </section>
</template>
