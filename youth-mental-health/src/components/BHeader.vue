<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
const isActive = (path) => route.path === path || route.path.startsWith(path + '/')
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
            <RouterLink :class="['nav-link', { active: isActive('/') }]" to="/">Home</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink :class="['nav-link', { active: isActive('/resources') }]" to="/resources">Resources</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink :class="['nav-link', { active: isActive('/events') }]" to="/events">Events</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink :class="['nav-link', { active: isActive('/help') }]" to="/help">Get Help</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink :class="['nav-link', { active: isActive('/contact') }]" to="/contact">Contact</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink :class="['nav-link', { active: isActive('/about') }]" to="/about">About</RouterLink>
          </li>
        </ul>
      </header>
    </div>
  </div>
</template>
