<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/auth'

const router = useRouter()

const email = ref('')
const password = ref('')

const error = ref('')
const submitting = ref(false)

function sanitize (s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const onSubmit = async () => {
  if (submitting.value) return
  error.value = ''

  const emailTrimmed = sanitize(email.value.trim())
  if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) {
    error.value = 'Please enter a valid email address.'
    return
  }
  if (!password.value) {
    error.value = 'Please enter your password.'
    return
  }

  submitting.value = true
  try {
    const ok = await login(emailTrimmed, password.value)
    if (ok === true) {
      router.push('/')
    } else if (typeof ok === 'string') {
      switch (ok) {
        case 'auth/user-not-found':
          error.value = 'No account found with that email.'; break
        case 'auth/wrong-password':
          error.value = 'Incorrect password.'; break
        case 'auth/invalid-credential':
          error.value = 'Invalid email or password.'; break
        case 'auth/too-many-requests':
          error.value = 'Too many attempts. Please try again later.'; break
        default:
          error.value = 'Login failed. Please try again.'
      }
    } else {
      error.value = 'Invalid email or password.'
    }
  } catch (e) {
    console.error('Login error', e)
    error.value = 'Could not log in. Please try again.'
  } finally {
    submitting.value = false
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

          <div v-if="error" class="text-danger mb-3" role="alert" aria-live="polite">{{ error }}</div>

          <div class="d-grid mb-2">
            <button type="submit" class="btn btn-primary" :disabled="submitting">{{ submitting ? 'Logging in…' : 'Log in' }}</button>
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
