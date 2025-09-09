<script setup>
import { useRouter } from 'vue-router'
import { isAuthenticated, logout } from '@/auth'
const router = useRouter()
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
          <li class="nav-item ms-3">
          <button v-if="isAuthenticated" class="btn btn-outline-danger btn-sm" @click="handleLogout">Logout</button>
        </li>
        </ul>
      </header>
    </div>
  </div>
</template>
