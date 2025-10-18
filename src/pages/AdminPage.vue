<template>
  <main id="main" tabindex="-1" class="container py-4">
    <h1 class="mb-3" data-page-title>Admin Dashboard</h1>

    <!-- Not authorized state -->
    <div v-if="checked && !isAdmin" class="alert alert-danger" role="alert" aria-live="assertive" tabindex="-1" ref="denyRef">
      You don't have permission to view this page.
    </div>

    <!-- Loading state -->
    <div v-else-if="!checked" class="text-muted" aria-live="polite">Checking your access…</div>

    <!-- Authorized content -->
    <div v-else class="row g-3">
      <section class="col-12">
        <div class="card h-100">
          <div class="card-header">
            <h2 class="h6 mb-0">Create New Event</h2>
          </div>
          <div class="card-body">
            <div
              v-if="showCreated"
              class="alert alert-success"
              role="alert"
              aria-live="assertive"
              tabindex="-1"
              ref="evSuccessRef"
            >
              Event created successfully.
            </div>

            <form @submit.prevent="addEvent" novalidate>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label for="ev-title" class="form-label">Title</label>
                  <input
                    id="ev-title"
                    ref="evTitleRef"
                    type="text"
                    class="form-control"
                    v-model.trim="newEvent.title"
                    required
                    :aria-invalid="evErrors.title ? 'true' : 'false'"
                    :aria-describedby="evErrors.title ? 'err-ev-title' : null"
                    placeholder="e.g., Study Stress Workshop"
                  />
                  <div v-if="evErrors.title" id="err-ev-title" class="text-danger small mt-1" role="alert">{{ evErrors.title }}</div>
                </div>

                <div class="col-12 col-md-6">
                  <label for="ev-datetime" class="form-label">Date &amp; Time</label>
                  <input
                    id="ev-datetime"
                    ref="evDateRef"
                    type="datetime-local"
                    class="form-control"
                    v-model="newEvent.datetime"
                    required
                    :aria-invalid="evErrors.datetime ? 'true' : 'false'"
                    :aria-describedby="evErrors.datetime ? 'err-ev-datetime' : null"
                  />
                  <div v-if="evErrors.datetime" id="err-ev-datetime" class="text-danger small mt-1" role="alert">{{ evErrors.datetime }}</div>
                </div>

                <div class="col-12">
                  <label for="ev-desc" class="form-label">Description (optional)</label>
                  <textarea
                    id="ev-desc"
                    class="form-control"
                    rows="2"
                    v-model.trim="newEvent.description"
                    placeholder="Brief details..."
                  ></textarea>
                </div>

                <div class="col-12 col-md-6">
                  <label for="ev-mode" class="form-label">Mode</label>
                  <select
                    id="ev-mode"
                    ref="evModeRef"
                    class="form-select"
                    v-model="newEvent.mode"
                    required
                    :aria-invalid="evErrors.mode ? 'true' : 'false'"
                    :aria-describedby="evErrors.mode ? 'err-ev-mode' : null"
                  >
                    <option>Online</option>
                    <option>In-person</option>
                    <option>Hybrid</option>
                  </select>
                  <div v-if="evErrors.mode" id="err-ev-mode" class="text-danger small mt-1" role="alert">{{ evErrors.mode }}</div>
                </div>

                <div class="col-12 col-md-6">
                  <label for="ev-location" class="form-label">Location</label>
                  <input
                    id="ev-location"
                    ref="evLocationRef"
                    type="text"
                    class="form-control"
                    v-model.trim="newEvent.location"
                    required
                    :aria-invalid="evErrors.location ? 'true' : 'false'"
                    :aria-describedby="evErrors.location ? 'err-ev-location' : 'ev-location-help'"
                    placeholder="e.g., Monash University, Clayton or Zoom"
                  />
                  <div id="ev-location-help" class="form-text">Enter the exact text you want to appear in the map search and Google Maps directions.</div>
                  <div v-if="evErrors.location" id="err-ev-location" class="text-danger small mt-1" role="alert">{{ evErrors.location }}</div>
                </div>
              </div>

              <div class="mt-3 d-flex gap-2">
                <button type="submit" class="btn btn-primary">Create Event</button>
                <button type="button" class="btn btn-outline-secondary" @click="resetEventForm">Clear</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h2 class="h6 mb-0">Quick actions</h2>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <RouterLink class="btn btn-primary" to="/events" aria-label="Go to Events to add, edit or delete events">
                Manage events
              </RouterLink>
              <RouterLink class="btn btn-outline-primary" to="/resources" aria-label="Go to Resources to curate support links">
                Curate resources
              </RouterLink>
              <RouterLink class="btn btn-outline-secondary" to="/contact" aria-label="View contact and support info">
                Contact &amp; support info
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <section class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-header">
            <h2 class="h6 mb-0">Your access</h2>
          </div>
          <div class="card-body">
            <p class="mb-1"><strong>Signed in as:</strong> {{ userEmail || '—' }}</p>
            <p class="mb-0"><strong>Role:</strong> {{ roleLabel }}</p>
            <p class="text-muted mt-2 small">Only approved admin accounts can open this page. Others are redirected.</p>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { currentUser } from '@/auth'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

function sanitize(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const router = useRouter()
const denyRef = ref(null)
const checked = ref(false)

// Firestore
const db = getFirestore()

// Admin: create event form state
const newEvent = ref({
  title: '',
  description: '',
  datetime: '',
  mode: 'Online',
  location: ''
})

const evErrors = ref({
  title: '',
  datetime: '',
  mode: '',
  location: ''
})

// Refs for focusing invalid controls / success
const evTitleRef = ref(null)
const evLocationRef = ref(null)
const evModeRef = ref(null)
const evSuccessRef = ref(null)
const evDateRef = ref(null)

function resetEventForm() {
  newEvent.value = { title: '', description: '', datetime: '', mode: 'Online', location: '' }
  evErrors.value = { title: '', datetime: '', mode: '', location: '' }
}

function validateEventForm() {
  evErrors.value = { title: '', datetime: '', mode: '', location: '' }
  if (!newEvent.value.title.trim()) evErrors.value.title = 'Title is required.'
  if (!newEvent.value.datetime) evErrors.value.datetime = 'Date & time is required.'
  if (!newEvent.value.mode) evErrors.value.mode = 'Mode is required.'
  if (!newEvent.value.location.trim()) evErrors.value.location = 'Location is required.'
  return Object.values(evErrors.value).every(v => !v)
}

async function addEvent() {
  if (!validateEventForm()) {
    // focus first invalid
    if (evErrors.value.title) { evTitleRef.value?.focus(); return }
    if (evErrors.value.datetime) { evDateRef.value?.focus(); return }
    if (evErrors.value.mode) { evModeRef.value?.focus(); return }
    if (evErrors.value.location) { evLocationRef.value?.focus(); return }
    return
  }
  try {
    const docData = {
      id: Date.now(),
      title: sanitize(newEvent.value.title.trim()),
      description: sanitize((newEvent.value.description || '').trim()),
      datetime: String(newEvent.value.datetime).trim(),
      mode: String(newEvent.value.mode).trim(),
      location: sanitize(newEvent.value.location.trim()),
      createdAt: serverTimestamp(),
      createdByEmail: (userEmail.value || 'admin').toLowerCase()
    }
    await addDoc(collection(db, 'events'), docData)
    // Show success message by toggling a flag element
    showCreated.value = true
    nextTick(() => evSuccessRef.value?.focus())
    // Reset after a short delay
    setTimeout(() => { showCreated.value = false }, 2500)
    resetEventForm()
  } catch (e) {
    console.error('Failed to create event', e)
    evErrors.value.title = 'Could not create event. Try again.'
    evTitleRef.value?.focus()
  }
}

const showCreated = ref(false)

const userEmail = computed(() => currentUser.value?.email || '')
const roleLabel = computed(() => currentUser.value?.role || '—')
const isAdmin = computed(() => {
  const r = currentUser.value?.role
  return typeof r === 'string' && r.toLowerCase() === 'admin'
})

onMounted(async () => {
  // Wait a tick to ensure currentUser is populated
  await nextTick()
  checked.value = true
  if (!isAdmin.value) {
    // If not admin, send to Home (or Login if not signed in)
    const dest = currentUser.value ? '/' : '/login?next=/admin'
    router.replace(dest)
    // Also announce denial (in case navigation is blocked or delayed)
    nextTick(() => denyRef.value?.focus())
  } else {
    // Focus main for SR/keyboard users
    requestAnimationFrame(() => {
      const main = document.getElementById('main')
      main && main.focus()
    })
  }
})
</script>

<style scoped>
/* Ensure focus is clearly visible; global styles may already set this */
:focus-visible {
  outline: 2px solid #0a7;
  outline-offset: 2px;
}
</style>