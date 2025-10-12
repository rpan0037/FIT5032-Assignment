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


              <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                <RouterLink to="/login" class="btn btn-outline-secondary">Cancel</RouterLink>
                <button type="submit" class="btn btn-primary">Create account</button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import defaultUsers from '@/assets/json/login_credentials.json'

const router = useRouter()

const form = ref({ name: '', email: '', password: '' })
const errors = ref({ name: '', email: '', password: '' })
const formError = ref('')

const success = ref(false)

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
  const ok = /.+@.+\..+/.test(form.value.email)
  errors.value.email = ok ? '' : 'Please enter a valid email address.'
}

function validatePassword() {
  errors.value.password = form.value.password.length < 8 ? 'Password must be at least 8 characters.' : ''
}

function onSubmit() {
  validateName();
  validateEmail();
  validatePassword()
  if (errors.value.name || errors.value.email || errors.value.password) return
  formError.value = ''

  const local = JSON.parse(localStorage.getItem('users_v1') || '[]')

  const emailLower = form.value.email.toLowerCase()
  const existsInLocal = local.some(u => (u.email || '').toLowerCase() === emailLower)
  const existsInDefaults = (defaultUsers || []).some(u => (u.email || '').toLowerCase() === emailLower)
  if (existsInLocal || existsInDefaults) {
    formError.value = 'An account with this email already exists.'
    return
  }

  const newUser = {
    id: Date.now(),
    name: sanitize(form.value.name),
    email: sanitize(form.value.email),
    password: form.value.password,
    role: "user"
  }

  const updated = [...local, newUser]
  localStorage.setItem('users_v1', JSON.stringify(updated))

  success.value = true
  setTimeout(() => {
    router.push({ name: 'Login' })
  }, 3000)
}
</script>

<style scoped>
</style>
