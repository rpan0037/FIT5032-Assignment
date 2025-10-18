<script setup>
import BHeader from './components/BHeader.vue'
</script>
<!-- src/App.vue -->
<template>
  <div class="d-flex flex-column min-vh-100">
    <BHeader />

    <main class="container py-4">
      <router-view />
    </main>

    <footer class="mt-auto py-3 border-top">
      <div class="container">
        <small>© 2025 YouthConnect | <a href="#">Privacy</a></small>
      </div>
    </footer>
  </div>
</template>
<style scoped></style>
