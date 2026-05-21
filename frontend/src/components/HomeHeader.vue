<script setup>
import { reactive, ref } from "vue";
import Modal from "./Modal.vue";
import { useToast } from "vue-toast-notification";
import { useAuth } from "../composables/useAuth";
import * as whatsappServices from "../services/whatsapp.js";

const { logout, loading: authLoading } = useAuth();
const $toast = useToast();
const isModalVisible = ref(false);
const isPairingModal = ref(false);
const loading = ref(false);

const formData = reactive({
  number: "",
  countryCode: "91",
  pairingCode: "",
});

const emit = defineEmits(["refresh"]);

const openModal = (name) => {
  if (name === "contact") {
    isModalVisible.value = true;
  } else if (name === "pairingcode") {
    isPairingModal.value = true;
  }
};

const closeModal = (name) => {
  if (name === "contact") {
    isModalVisible.value = false;
    formData.number = "";
  } else if (name === "pairingcode") {
    isPairingModal.value = false;
  }
};

const copyPairingCode = () => {
  navigator.clipboard.writeText(formData.pairingCode).then(() => {
    $toast.success("Text copied successfully!", {
      position: "top-right",
    });
  });
};

const submitBtn = async () => {
  try {
    if (!formData.number) {
      $toast.error("Mobile number is required!", {
        position: "top-right",
      });
      return;
    }

    loading.value = true;

    const fullNumber = formData.countryCode + formData.number;

    // Check if number already exists
    const exists = await whatsappServices.checkPhoneNumberExists(parseInt(fullNumber));

    if (exists) {
      $toast.error("Number already exists!", {
        position: "top-right",
      });
      return;
    }

    // Get pairing code from backend
    const pairingCode = await whatsappServices.getPairingCode(fullNumber, false);

    // Insert user
    await whatsappServices.insertUser({
      contact: parseInt(fullNumber),
    });

    closeModal("contact");
    $toast.success("Number added successfully!", {
      position: "top-right",
    });
    
    formData.pairingCode = pairingCode;
    openModal("pairingcode");
    
    // Emit refresh event to parent
    emit("refresh");
  } catch (error) {
    $toast.error(error.message || "Failed to add number", {
      position: "top-right",
    });
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  try {
    await logout();
  } catch (error) {
    // Error handled in composable
  }
};
</script>

<template>
  <section class="mb-3 p-2 px-5 flex justify-between items-center">
    <h2 class="text-white">Connected WhatsApp Accounts</h2>
    <div>
      <button
        @click="() => openModal('contact')"
        class="mr-3 text-white focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="authLoading"
      >
        Add Account
      </button>
      <button
        @click="handleLogout"
        class="mr-3 text-white focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="authLoading"
      >
        <span v-if="authLoading">Logging out...</span>
        <span v-else>Logout</span>
      </button>

      <!-- Modal for add contact -->
      <Modal
        v-if="isModalVisible"
        :show="isModalVisible"
        @close="() => closeModal('contact')"
        @submit="submitBtn"
        :showSubmitButton="true"
        :showUpdateButton="false"
        :loading="loading"
        title="Add Contact"
      >
        <div>
          <label for="number" class="block mb-2 text-sm font-medium text-white">
            Number
          </label>
          <div class="flex space-x-2">
            <select
              name="countryCode"
              v-model="formData.countryCode"
              class="border text-sm rounded-lg outline-none focus:ring-blue-500 focus:ring-2 block p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
              required
              :disabled="loading"
            >
              <option value="1">+1 (USA)</option>
              <option value="91">+91 (India)</option>
              <option value="44">+44 (UK)</option>
              <option value="61">+61 (Australia)</option>
            </select>

            <input
              type="text"
              name="number"
              v-model="formData.number"
              class="border text-sm rounded-lg outline-none focus:ring-blue-500 focus:ring-2 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
              placeholder="Enter new number"
              required
              :disabled="loading"
            />
          </div>
        </div>
      </Modal>

      <!-- Modal for Pairing code -->
      <Modal
        v-if="isPairingModal"
        :show="isPairingModal"
        @close="() => closeModal('pairingcode')"
        @copyCode="copyPairingCode"
        :showCopyButton="true"
        :showSubmitButton="false"
        title=""
      >
        <h2 class="text-2xl text-center font-semibold text-green-500">
          Pairing Successful!
        </h2>
        <p class="text-gray-400 mt-1 mb-5 text-sm text-center">
          Your device has been linked. Just two steps away.
        </p>

        <div
          class="bg-gray-800 border border-gray-600 text-gray-300 text-center text-xl font-semibold h-12 mt-4 p-2 rounded-lg"
        >
          {{ formData.pairingCode }}
        </div>
      </Modal>
    </div>
  </section>
</template>
