<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="card">
          <div class="card-header">
            <h2 class="h5 mb-0">Register</h2>
          </div>
          <div class="card-body">

            <div v-if="success" class="alert alert-success" role="alert">
              Account created! Redirecting to login…
            </div>
            <div v-if="formError" class="alert alert-danger" role="alert">
              {{ formError }}
            </div>

            <form @submit.prevent="onSubmit" novalidate>
              <div class="mb-3">
                <label for="name" class="form-label">Full Name</label>
                <input id="name" type="text" class="form-control" v-model.trim="form.name" @blur="validateName" />
                <div v-if="errors.name" class="text-danger small mt-1">{{ errors.name }}</div>
              </div>

              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input id="email" type="email" class="form-control" v-model.trim="form.email" @blur="validateEmail" />
                <div v-if="errors.email" class="text-danger small mt-1">{{ errors.email }}</div>
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input id="password" type="password" class="form-control" v-model.trim="form.password"
                  @blur="validatePassword" />
                <div v-if="errors.password" class="text-danger small mt-1">{{ errors.password }}</div>
              </div>

              <div class="mb-3">
                <label for="confirm" class="form-label">Confirm Password</label>
                <input id="confirm" type="password" class="form-control" v-model.trim="form.confirm" @blur="validateConfirm" aria-describedby="confirmHelp" />
                <div id="confirmHelp" class="form-text">Re-enter your password to confirm.</div>
                <div v-if="errors.confirm" class="text-danger small mt-1">{{ errors.confirm }}</div>
              </div>
              <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="consent" v-model="form.consent" @change="validateConsent" />
                <label class="form-check-label" for="consent">
                  I agree to the community guidelines and privacy policy.
                </label>
                <div v-if="errors.consent" class="text-danger small mt-1">{{ errors.consent }}</div>
              </div>

              <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                <RouterLink to="/login" class="btn btn-outline-secondary">Cancel</RouterLink>
                <button type="submit" class="btn btn-primary" :disabled="submitting || hasErrors">{{ submitting ? 'Creating…' : 'Create account' }}</button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { ensureUserRoleByEmail } from '@/auth.js'

const router = useRouter()

const form = ref({ name: '', email: '', password: '', confirm: '', consent: false })
const errors = ref({ name: '', email: '', password: '', confirm: '', consent: '' })
const formError = ref('')

const success = ref(false)
const submitting = ref(false)
const hasErrors = computed(() => !!(errors.value.name || errors.value.email || errors.value.password || errors.value.confirm || errors.value.consent))

function sanitize (s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function validateName() {
  errors.value.name = form.value.name.length < 2 ? 'Please enter at least 2 characters.' : ''
}

function validateEmail() {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.value.email)
  errors.value.email = ok ? '' : 'Please enter a valid email address.'
}

function validatePassword() {
  const pwd = form.value.password
  const okLength = pwd.length >= 8
  const hasLetter = /[A-Za-z]/.test(pwd)
  const hasNumber = /\d/.test(pwd)
  errors.value.password = okLength && hasLetter && hasNumber
    ? ''
    : 'Password must be at least 8 characters and include letters and numbers.'
}

function validateConfirm () {
  errors.value.confirm = form.value.confirm !== form.value.password ? 'Passwords do not match.' : ''
}

function validateConsent () {
  errors.value.consent = form.value.consent ? '' : 'You must agree to continue.'
}

async function onSubmit() {
  if (submitting.value) return
  validateName()
  validateEmail()
  validatePassword()
  validateConfirm()
  validateConsent()
  if (hasErrors.value) return
  submitting.value = true
  formError.value = ''

  try {
    const auth = getAuth()
    const userCred = await createUserWithEmailAndPassword(auth, form.value.email, form.value.password)
    if (userCred?.user && form.value.name) {
      await updateProfile(userCred.user, { displayName: sanitize(form.value.name) })
      await ensureUserRoleByEmail(userCred.user.email, 'user', sanitize(form.value.name))
    } else {
      await ensureUserRoleByEmail(userCred.user.email, 'user', sanitize(form.value.name))
    }
    success.value = true
    submitting.value = false
    setTimeout(() => {
      router.push({ name: 'Login' })
    }, 1500)
  } catch (e) {
    console.error('Registration failed', e)
    submitting.value = false
    switch (e?.code) {
      case 'auth/email-already-in-use':
        formError.value = 'An account with this email already exists.'; break
      case 'auth/invalid-email':
        formError.value = 'Please enter a valid email address.'; break
      case 'auth/weak-password':
        formError.value = 'Password is too weak.'; break
      default:
        formError.value = 'Could not create account. Please try again.'
    }
  }
}
</script>

<style scoped>
</style>
