<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/auth'

const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')

const onSubmit = () => {
  error.value = ''
  const ok = login(email.value.trim(), password.value)
  if (ok) {
    router.push('/')
  } else {
    error.value = 'Invalid email or password.'
  }
}
</script>

<template>
  <div class="container mt-5 page-container">
    <div class="row">
      <div class="col-md-6 offset-md-3">
        <div class="text-center mb-4">
          <h1 class="display-6">Member Login</h1>
          <p class="lead mb-0">Use your credentials to continue.</p>
        </div>

        <form @submit.prevent="onSubmit">
          <div class="mb-3">
            <label class="form-label" for="email">Email</label>
            <input id="email" class="form-control" type="email" v-model="email" autocomplete="email" />
          </div>

          <div class="mb-3">
            <label class="form-label" for="password">Password</label>
            <input id="password" class="form-control" type="password" v-model="password" autocomplete="current-password" />
          </div>

          <div v-if="error" class="text-danger mb-3">{{ error }}</div>

          <div class="d-grid mb-2">
            <button type="submit" class="btn btn-primary">Log in</button>
          </div>
          <div class="d-grid">
            <RouterLink to="/register" class="btn btn-outline-secondary">Register</RouterLink>
          </div>
        </form>

        <div class="mt-3 small text-muted text-center">
          Don’t have an account yet? Please register to get started.
        </div>
      </div>
    </div>
  </div>
</template>
