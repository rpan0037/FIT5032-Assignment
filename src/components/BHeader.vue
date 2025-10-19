<script setup>
import { useRouter } from 'vue-router'
import { isAuthenticated, currentUser, logout } from '@/auth'
import { computed } from 'vue'
const router = useRouter()
const displayName = computed(() => {
  const u = currentUser?.value
  if (!u) return ''
  // Prefer name; fall back to email; otherwise blank
  return u.name || u.displayName || u.email || ''
})
const isAdminUser = computed(() => {
  const role = currentUser?.value?.role
  return role.toLowerCase() === 'admin'
})
function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="border-bottom">
    <div class="container">
      <header class="d-flex flex-wrap align-items-center py-3" role="navigation" aria-label="Main navigation">

        <RouterLink to="/" class="navbar-brand fw-bold text-decoration-none text-dark">
          YouthConnect
        </RouterLink>

        <ul class="nav nav-pills flex-wrap justify-content-center ms-md-auto">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/">Home</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/resources">Resources</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/events">Events</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/help">Get Help</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/contact">Contact</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/about">About</RouterLink>
          </li>
          <li class="nav-item" v-if="isAuthenticated && isAdminUser">
            <RouterLink class="nav-link" to="/admin">Admin</RouterLink>
          </li>
          <li class="nav-item d-flex align-items-center gap-2 ms-3" v-if="isAuthenticated">
            <span class="badge text-bg-light" aria-live="polite">Welcome, {{ displayName }}</span>
            <button class="btn btn-outline-danger btn-sm" @click="handleLogout" aria-label="Log out">
              Logout
            </button>
          </li>
        </ul>
      </header>
    </div>
  </div>
</template>
