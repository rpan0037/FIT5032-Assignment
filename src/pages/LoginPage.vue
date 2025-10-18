<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/auth'

const router = useRouter()

const email = ref('')
const password = ref('')

const emailRef = ref(null)
const passwordRef = ref(null)
const errorRef = ref(null)
const emailError = ref('')
const passwordError = ref('')

const error = ref('')
const submitting = ref(false)

function sanitize(s) {
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
  emailError.value = ''
  passwordError.value = ''

  const emailTrimmed = sanitize(email.value.trim())
  if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) {
    emailError.value = 'Please enter a valid email address.'
    nextTick(() => emailRef.value?.focus())
    return
  }
  if (!password.value) {
    passwordError.value = 'Please enter your password.'
    nextTick(() => passwordRef.value?.focus())
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
          emailError.value = 'No account found with that email.'
          nextTick(() => emailRef.value?.focus())
          break
        case 'auth/wrong-password':
          passwordError.value = 'Incorrect password.'
          nextTick(() => passwordRef.value?.focus())
          break
        case 'auth/invalid-credential':
          error.value = 'Invalid email or password.'
          nextTick(() => errorRef.value?.focus())
          break
        case 'auth/too-many-requests':
          error.value = 'Too many attempts. Please try again later.'
          nextTick(() => errorRef.value?.focus())
          break
        default:
          error.value = 'Login failed. Please try again.'
          nextTick(() => errorRef.value?.focus())
      }
    } else {
      error.value = 'Invalid email or password.'
      nextTick(() => errorRef.value?.focus())
    }
  } catch (e) {
    console.error('Login error', e)
    error.value = 'Could not log in. Please try again.'
    nextTick(() => errorRef.value?.focus())
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
            <input id="email" ref="emailRef" class="form-control" type="email" v-model="email" autocomplete="email"
              required :aria-invalid="emailError ? 'true' : 'false'"
              :aria-describedby="emailError ? 'err-email' : null" />
            <div v-if="emailError" id="err-email" class="text-danger small mt-1" role="alert">{{ emailError }}</div>
          </div>

          <div class="mb-3">
            <label class="form-label" for="password">Password</label>
            <input id="password" ref="passwordRef" class="form-control" type="password" v-model="password"
              autocomplete="current-password" required :aria-invalid="passwordError ? 'true' : 'false'"
              :aria-describedby="passwordError ? 'err-password' : null" />
            <div v-if="passwordError" id="err-password" class="text-danger small mt-1" role="alert">{{ passwordError }}
            </div>
          </div>

          <div v-if="error" class="text-danger mb-3" role="alert" aria-live="assertive" tabindex="-1" ref="errorRef">{{
            error }}</div>

          <div class="d-grid mb-2">
            <button type="submit" class="btn btn-primary" :disabled="submitting">{{ submitting ? 'Logging in…' : 'Login' }}</button>
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
