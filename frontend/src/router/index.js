import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "../pages/LoginPage.vue";
import SetupProfilePage from "../pages/SetupProfilePage.vue";
import SetupApiPage from "../pages/SetupApiPage.vue";
import Home from "../pages/Home.vue";
import SignUpPage from "../pages/SignUp.vue";
import { supabase } from "../lib/supabase";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: LoginPage,
      meta: { requiresGuest: true },
    },
    {
      path: "/signup",
      name: "Signup",
      component: SignUpPage,
      meta: { requiresGuest: true },
    },
    {
      path: "/setup-profile",
      name: "Setup Profile",
      component: SetupProfilePage,
      meta: { requiresAuth: true },
    },
    {
      path: "/setup-api",
      name: "Setup API",
      component: SetupApiPage,
      meta: { requiresAuth: true },
    },
    {
      path: "/",
      name: "Home",
      component: Home,
      meta: { requiresAuth: true },
    },
  ],
});

// Fixed authentication guard with proper async handling
router.beforeEach(async (to, from) => {
  const { data } = await supabase.auth.getSession();
  const isAuthenticated = !!data.session;

  // If route requires auth and user is not authenticated
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: "Login" };
  }

  // If route requires guest (login/signup) and user is authenticated
  if (to.meta.requiresGuest && isAuthenticated) {
    return { name: "Home" };
  }
});

export default router;