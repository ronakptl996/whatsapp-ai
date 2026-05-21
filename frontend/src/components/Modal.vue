<template>
  <div
    v-if="show"
    class="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50"
  >
    <div
      class="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow w-full max-w-lg"
    >
      <!-- Modal Header -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-white">{{ title }}</h2>
        <button 
          @click="closeModal" 
          class="text-gray-400 text-2xl hover:text-white transition-colors"
        >
          &times;
        </button>
      </div>

      <!-- Modal Body -->
      <div>
        <slot></slot>
      </div>

      <!-- Modal Footer -->
      <div class="flex justify-end mt-4 gap-2">
        <button
          v-if="showCopyButton"
          @click="copyCode"
          class="text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-green-600 hover:bg-green-700 focus:ring-green-800"
        >
          Copy Code
        </button>
        
        <button
          v-if="showUpdateButton"
          @click="handleUpdate"
          class="text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800"
          :disabled="loading"
        >
          <span v-if="loading">Updating...</span>
          <span v-else>Update</span>
        </button>
        
        <button
          v-if="showSubmitButton"
          @click="handleSubmit"
          class="text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800"
          :disabled="loading"
        >
          <span v-if="loading">Submitting...</span>
          <span v-else>Submit</span>
        </button>
        
        <button
          @click="closeModal"
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700 transition-colors"
          :disabled="loading"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Modal Title",
  },
  showCopyButton: {
    type: Boolean,
    default: false,
  },
  showUpdateButton: {
    type: Boolean,
    default: false,
  },
  showSubmitButton: {
    type: Boolean,
    default: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "submit", "copyCode", "update"]);

const closeModal = () => {
  emit("close");
};

const handleSubmit = () => {
  emit("submit");
};

const copyCode = () => {
  emit("copyCode");
};

const handleUpdate = () => {
  emit("update");
};
</script>
