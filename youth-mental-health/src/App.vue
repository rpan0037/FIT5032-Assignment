<script setup></script>

<!-- src/App.vue -->
<template>
  <header style="padding:12px; border-bottom:1px solid #eee; display:flex; gap:16px; align-items:center;">
    <!-- Logo -->
    <strong style="margin-right:auto;">YouthConnect</strong>

    <!-- Navigation -->
    <router-link to="/">Home</router-link>
    <router-link to="/about">About</router-link>
    <router-link to="/resources">Resources</router-link>
    <router-link to="/events">Events</router-link>
    <router-link to="/help">Help</router-link>
    <router-link to="/contact">Contact</router-link>
  </header>

  <main>
    <router-view />
  </main>

  <footer style="padding:12px; border-top:1px solid #eee; margin-top:40px;">
    <small>© 2025 YouthConnect | <a href="#">Privacy</a></small>
  </footer>
</template>
<style scoped></style>
