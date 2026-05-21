<script setup>
import { onMounted, reactive, ref } from "vue";
import { useToast } from "vue-toast-notification";
import HomeHeader from "../components/HomeHeader.vue";
import Modal from "../components/Modal.vue";
import * as whatsappServices from "../services/whatsapp.js";

const $toast = useToast();
const loading = ref(false);
const usersLoading = ref(false);
const isModalVisible = ref(false);
const isPairingModal = ref(false);

const formData = reactive({
  users: [],
  number: "",
  id: "",
  countryCode: "91",
  pairingCode: "",
  oldNumber: "",
});

const openModal = async (id) => {
  try {
    if (!id) {
      $toast.error("Contact ID is required!", {
        position: "top-right",
      });
      return;
    }

    loading.value = true;
    const userData = await whatsappServices.getUserById(id);

    if (userData) {
      formData.number = userData.contact.toString().slice(2);
      formData.countryCode = userData.contact.toString().slice(0, 2);
      formData.id = userData.id;
      formData.oldNumber = userData.contact;
      isModalVisible.value = true;
    }
  } catch (error) {
    $toast.error(error.message || "Failed to load user data", {
      position: "top-right",
    });
  } finally {
    loading.value = false;
  }
};

const closeModal = () => {
  isModalVisible.value = false;
  formData.number = "";
};

const closePairingModal = () => {
  isPairingModal.value = false;
};

const copyPairingCode = () => {
  navigator.clipboard.writeText(formData.pairingCode).then(() => {
    $toast.success("Text copied successfully!", {
      position: "top-right",
    });
  });
};

const fetchData = async () => {
  try {
    usersLoading.value = true;
    const usersData = await whatsappServices.getUsers();
    formData.users = usersData;
  } catch (error) {
    $toast.error(error.message || "Failed to load users", {
      position: "top-right",
    });
  } finally {
    usersLoading.value = false;
  }
};

const updateBtn = async () => {
  try {
    if (!formData.number) {
      $toast.error("Mobile number is required!", {
        position: "top-right",
      });
      return;
    }

    loading.value = true;

    // Check if number already exists (excluding current user)
    const fullNumber = parseInt(formData.countryCode + formData.number);
    const exists = await whatsappServices.checkPhoneNumberExists(fullNumber);

    if (exists) {
      $toast.error("Number already exists!", {
        position: "top-right",
      });
      return;
    }

    // Get pairing code
    const pairingCode = await whatsappServices.getPairingCode(
      formData.countryCode + formData.number,
      true,
      formData.oldNumber
    );

    // Update user
    await whatsappServices.updateUser(formData.id, fullNumber);

    closeModal();
    $toast.success("Number updated successfully!", {
      position: "top-right",
    });
    
    formData.pairingCode = pairingCode;
    isPairingModal.value = true;
    await fetchData();
  } catch (error) {
    $toast.error(error.message || "Failed to update number", {
      position: "top-right",
    });
  } finally {
    loading.value = false;
  }
};

const deleteUser = async (id) => {
  if (!confirm("Are you sure you want to delete this account?")) {
    return;
  }

  try {
    await whatsappServices.deleteUser(id);
    $toast.success("Account deleted successfully!", {
      position: "top-right",
    });
    await fetchData();
  } catch (error) {
    $toast.error(error.message || "Failed to delete account", {
      position: "top-right",
    });
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <!-- Modal for update contact -->
  <Modal
    v-if="isModalVisible"
    :show="isModalVisible"
    @close="closeModal"
    @update="updateBtn"
    :showUpdateButton="true"
    :showSubmitButton="false"
    :loading="loading"
    title="Update contact"
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
    @close="closePairingModal"
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

  <HomeHeader @refresh="fetchData" />
  
  <section class="p-4">
    <!-- Loading State -->
    <div v-if="usersLoading" class="text-white flex justify-center items-center h-[500px]">
      <p class="text-xl">Loading accounts...</p>
    </div>
    
    <!-- Empty State -->
    <div
      v-else-if="formData.users.length === 0"
      class="text-white flex justify-center items-center flex-col h-[500px]"
    >
      <h3 class="pb-1 text-xl font-semibold">No accounts added yet.</h3>
      <p class="text-gray-400">Click "Add Account" in the header to get started</p>
    </div>
    
    <!-- Users Grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:w-4/5 m-auto"
    >
      <div v-for="data in formData.users" :key="data.id">
        <div
          class="text-white bg-blue-950 p-4 rounded-sm cursor-pointer flex justify-between items-center gap-2"
        >
          <span class="truncate">{{ data.contact }}</span>
          <div class="flex gap-1">
            <button
              class="py-1 px-2 text-xs font-medium focus:outline-none rounded-lg border focus:z-10 focus:ring-1 ring-gray-700 bg-gray-800 text-gray-400 border-gray-600 hover:text-white hover:bg-gray-700 transition-colors"
              @click="() => openModal(data.id)"
            >
              Update
            </button>
            <button
              class="py-1 px-2 text-xs font-medium focus:outline-none rounded-lg border focus:z-10 focus:ring-1 ring-red-700 bg-gray-800 text-red-400 border-red-600 hover:text-white hover:bg-red-700 transition-colors"
              @click="() => deleteUser(data.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
