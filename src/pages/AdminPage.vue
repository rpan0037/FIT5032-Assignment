<template>
  <main id="main" tabindex="-1" class="container py-4">
    <h1 class="mb-3" data-page-title>Admin Dashboard</h1>

    <!-- Not authorized state -->
    <div v-if="checked && !isAdmin" class="alert alert-danger" role="alert" aria-live="assertive" tabindex="-1"
      ref="denyRef">
      You don't have permission to view this page.
    </div>

    <!-- Loading state -->
    <div v-else-if="!checked" class="text-muted" aria-live="polite">Checking your access…</div>

    <!-- Authorized content -->
    <div v-else class="row g-3">
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
      <section class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h2 class="h6 mb-0">Quick actions</h2>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <button class="btn btn-success" type="button" @click="exportHelpRequestsCSV"
                aria-label="Download a CSV of all help requests">
                Export help requests (CSV)
              </button>
              <button class="btn btn-warning" type="button" @click="showBulk = !showBulk"
                :aria-expanded="showBulk ? 'true' : 'false'" aria-controls="bulk-email-form">
                Email all users
              </button>
              <RouterLink class="btn btn-primary" to="/events" aria-label="Go to Events to add, edit or delete events">
                Manage events
              </RouterLink>
              <RouterLink class="btn btn-outline-primary" to="/resources"
                aria-label="Go to Resources to curate support links">
                Curate resources
              </RouterLink>
              <RouterLink class="btn btn-outline-secondary" to="/contact" aria-label="View contact and support info">
                Contact &amp; support info
              </RouterLink>
            </div>
            <div v-if="showBulk" id="bulk-email-form" class="mt-3">
              <div class="alert alert-info small" role="status">
                This will email <strong>all users</strong> who have registered with us.
              </div>
              <div v-if="bulkError" class="alert alert-danger" role="alert" aria-live="assertive">{{ bulkError }}</div>
              <div v-if="bulkResult" class="alert alert-success" role="alert" aria-live="assertive" tabindex="-1"
                ref="bulkSuccessRef">
                {{ bulkResult }}
              </div>
              <div class="mb-2">
                <label for="bulk-subject" class="form-label">Subject</label>
                <input id="bulk-subject" type="text" class="form-control" v-model.trim="bulkSubject"
                  placeholder="e.g., New events this month" />
              </div>
              <div class="mb-2">
                <label for="bulk-message" class="form-label">Message</label>
                <textarea id="bulk-message" class="form-control" rows="4" v-model.trim="bulkMessage"
                  placeholder="Write your announcement…"></textarea>
                <div class="form-text">Basic formatting supported. New lines will be preserved.</div>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-primary" :disabled="bulkSending" @click="sendBulkEmail">
                  {{ bulkSending ? 'Sending…' : 'Send to all users' }}
                </button>
                <button class="btn btn-outline-secondary" type="button" @click="showBulk = false">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="col-12">
        <div class="card h-100">
          <div class="card-header">
            <h2 class="h6 mb-0">Create New Event</h2>
          </div>
          <div class="card-body">
            <div v-if="showCreated" class="alert alert-success" role="alert" aria-live="assertive" tabindex="-1"
              ref="evSuccessRef">
              Event created successfully.
            </div>

            <form @submit.prevent="addEvent" novalidate>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label for="ev-title" class="form-label">Title</label>
                  <input id="ev-title" ref="evTitleRef" type="text" class="form-control" v-model.trim="newEvent.title"
                    required :aria-invalid="evErrors.title ? 'true' : 'false'"
                    :aria-describedby="evErrors.title ? 'err-ev-title' : null"
                    placeholder="e.g., Study Stress Workshop" />
                  <div v-if="evErrors.title" id="err-ev-title" class="text-danger small mt-1" role="alert">{{
                    evErrors.title }}</div>
                </div>

                <div class="col-12 col-md-6">
                  <label for="ev-datetime" class="form-label">Date &amp; Time</label>
                  <input id="ev-datetime" ref="evDateRef" type="datetime-local" class="form-control"
                    v-model="newEvent.datetime" required :aria-invalid="evErrors.datetime ? 'true' : 'false'"
                    :aria-describedby="evErrors.datetime ? 'err-ev-datetime' : null" />
                  <div v-if="evErrors.datetime" id="err-ev-datetime" class="text-danger small mt-1" role="alert">{{
                    evErrors.datetime }}</div>
                </div>

                <div class="col-12">
                  <label for="ev-desc" class="form-label">Description (optional)</label>
                  <textarea id="ev-desc" class="form-control" rows="2" v-model.trim="newEvent.description"
                    placeholder="Brief details..."></textarea>
                </div>

                <div class="col-12 col-md-6">
                  <label for="ev-mode" class="form-label">Mode</label>
                  <select id="ev-mode" ref="evModeRef" class="form-select" v-model="newEvent.mode" required
                    :aria-invalid="evErrors.mode ? 'true' : 'false'"
                    :aria-describedby="evErrors.mode ? 'err-ev-mode' : null">
                    <option>Online</option>
                    <option>In-person</option>
                    <option>Hybrid</option>
                  </select>
                  <div v-if="evErrors.mode" id="err-ev-mode" class="text-danger small mt-1" role="alert">{{
                    evErrors.mode }}</div>
                </div>

                <div class="col-12 col-md-6">
                  <label for="ev-location" class="form-label">Location</label>
                  <input id="ev-location" ref="evLocationRef" type="text" class="form-control"
                    v-model.trim="newEvent.location" required :aria-invalid="evErrors.location ? 'true' : 'false'"
                    :aria-describedby="evErrors.location ? 'err-ev-location' : 'ev-location-help'"
                    placeholder="e.g., Monash University, Clayton or Zoom" />
                  <div id="ev-location-help" class="form-text">Enter the exact text you want to appear in the map search
                    and Google Maps directions.</div>
                  <div v-if="evErrors.location" id="err-ev-location" class="text-danger small mt-1" role="alert">{{
                    evErrors.location }}</div>
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

      <section class="col-12">
        <div class="card h-100">
          <div class="card-header">
            <h2 class="h6 mb-0">Add Resource</h2>
          </div>
          <div class="card-body">
            <div v-if="showResCreated" class="alert alert-success" role="alert" aria-live="assertive" tabindex="-1"
              ref="resSuccessRef">
              Resource added successfully.
            </div>
            <form @submit.prevent="addResource" novalidate>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label for="res-title" class="form-label">Title</label>
                  <input id="res-title" ref="resTitleRef" type="text" class="form-control"
                    v-model.trim="newResource.title" required :aria-invalid="resErrors.title ? 'true' : 'false'"
                    :aria-describedby="resErrors.title ? 'err-res-title' : null" />
                  <div v-if="resErrors.title" id="err-res-title" class="text-danger small mt-1" role="alert">{{
                    resErrors.title }}</div>
                </div>
                <div class="col-12 col-md-6">
                  <label for="res-url" class="form-label">URL</label>
                  <input id="res-url" ref="resUrlRef" type="url" class="form-control" v-model.trim="newResource.url"
                    placeholder="https://…" required :aria-invalid="resErrors.url ? 'true' : 'false'"
                    :aria-describedby="resErrors.url ? 'err-res-url' : null" />
                  <div v-if="resErrors.url" id="err-res-url" class="text-danger small mt-1" role="alert">{{
                    resErrors.url }}</div>
                </div>
                <div class="col-12 col-md-4">
                  <label for="res-audience" class="form-label">Audience</label>
                  <input id="res-audience" ref="resAudienceRef" type="text" class="form-control"
                    v-model.trim="newResource.audience" placeholder="e.g., Youth" required
                    :aria-invalid="resErrors.audience ? 'true' : 'false'"
                    :aria-describedby="resErrors.audience ? 'err-res-audience' : null" />
                  <div v-if="resErrors.audience" id="err-res-audience" class="text-danger small mt-1" role="alert">{{
                    resErrors.audience }}</div>
                </div>
                <div class="col-12 col-md-4">
                  <label for="res-topic" class="form-label">Topic</label>
                  <input id="res-topic" ref="resTopicRef" type="text" class="form-control"
                    v-model.trim="newResource.topic" placeholder="e.g., Sleep" required
                    :aria-invalid="resErrors.topic ? 'true' : 'false'"
                    :aria-describedby="resErrors.topic ? 'err-res-topic' : null" />
                  <div v-if="resErrors.topic" id="err-res-topic" class="text-danger small mt-1" role="alert">{{
                    resErrors.topic }}</div>
                </div>
                <div class="col-12 col-md-4">
                  <label for="res-format" class="form-label">Format</label>
                  <select id="res-format" ref="resFormatRef" class="form-select" v-model="newResource.format" required
                    :aria-invalid="resErrors.format ? 'true' : 'false'"
                    :aria-describedby="resErrors.format ? 'err-res-format' : null">
                    <option>Article</option>
                    <option>Video</option>
                    <option>Podcast</option>
                    <option>Website</option>
                    <option>Guide</option>
                  </select>
                  <div v-if="resErrors.format" id="err-res-format" class="text-danger small mt-1" role="alert">{{
                    resErrors.format }}</div>
                </div>
              </div>
              <div class="mt-3 d-flex gap-2">
                <button type="submit" class="btn btn-primary">Add Resource</button>
                <button type="button" class="btn btn-outline-secondary" @click="resetResourceForm">Clear</button>
              </div>
            </form>
          </div>
        </div>
      </section>
      <section class="col-12">
        <div class="card h-100">
          <div class="card-header">
            <h2 class="h6 mb-0">Add Provider</h2>
          </div>
          <div class="card-body">
            <div v-if="showProvCreated" class="alert alert-success" role="alert" aria-live="assertive" tabindex="-1"
              ref="provSuccessRef">
              Provider added successfully.
            </div>
            <form @submit.prevent="addProvider" novalidate>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label for="prov-name" class="form-label">Name</label>
                  <input id="prov-name" ref="provNameRef" type="text" class="form-control"
                    v-model.trim="newProvider.name" required :aria-invalid="provErrors.name ? 'true' : 'false'"
                    :aria-describedby="provErrors.name ? 'err-prov-name' : null" />
                  <div v-if="provErrors.name" id="err-prov-name" class="text-danger small mt-1" role="alert">{{
                    provErrors.name }}</div>
                </div>

                <div class="col-12 col-md-6">
                  <label for="prov-email" class="form-label">Email</label>
                  <input id="prov-email" ref="provEmailRef" type="email" class="form-control"
                    v-model.trim="newProvider.email" required :aria-invalid="provErrors.email ? 'true' : 'false'"
                    :aria-describedby="provErrors.email ? 'err-prov-email' : null" />
                  <div v-if="provErrors.email" id="err-prov-email" class="text-danger small mt-1" role="alert">{{
                    provErrors.email }}</div>
                </div>

                <div class="col-12 col-md-4">
                  <label for="prov-phone" class="form-label">Phone</label>
                  <input id="prov-phone" ref="provPhoneRef" type="text" class="form-control"
                    v-model.trim="newProvider.phone" required :aria-invalid="provErrors.phone ? 'true' : 'false'"
                    :aria-describedby="provErrors.phone ? 'err-prov-phone' : null" />
                  <div v-if="provErrors.phone" id="err-prov-phone" class="text-danger small mt-1" role="alert">{{
                    provErrors.phone }}</div>
                </div>

                <div class="col-12 col-md-4">
                  <label for="prov-region" class="form-label">Region</label>
                  <input id="prov-region" ref="provRegionRef" type="text" class="form-control"
                    v-model.trim="newProvider.region" placeholder="e.g., Melbourne" required
                    :aria-invalid="provErrors.region ? 'true' : 'false'"
                    :aria-describedby="provErrors.region ? 'err-prov-region' : null" />
                  <div v-if="provErrors.region" id="err-prov-region" class="text-danger small mt-1" role="alert">{{
                    provErrors.region }}</div>
                </div>

                <div class="col-12 col-md-4">
                  <label for="prov-type" class="form-label">Type</label>
                  <input id="prov-type" ref="provTypeRef" type="text" class="form-control"
                    v-model.trim="newProvider.type" placeholder="e.g., Counsellor" required
                    :aria-invalid="provErrors.type ? 'true' : 'false'"
                    :aria-describedby="provErrors.type ? 'err-prov-type' : null" />
                  <div v-if="provErrors.type" id="err-prov-type" class="text-danger small mt-1" role="alert">{{
                    provErrors.type }}</div>
                </div>
              </div>
              <div class="mt-3 d-flex gap-2">
                <button type="submit" class="btn btn-primary">Add Provider</button>
                <button type="button" class="btn btn-outline-secondary" @click="resetProviderForm">Clear</button>
              </div>
            </form>
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
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'

function sanitize(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ---- CSV export helpers (help-requests) ----
function toCSV(rows) {
  if (!rows || !rows.length) return ''
  const headers = Array.from(rows.reduce((set, r) => {
    Object.keys(r || {}).forEach(k => set.add(k))
    return set
  }, new Set()))
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => esc(r[h])).join(','))
  ]
  return lines.join('\n')
}
function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', filename)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
async function exportHelpRequestsCSV() {
  try {
    const colRef = collection(db, 'help-requests')
    const q = query(colRef, orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    const rows = snap.docs.map(d => {
      const data = d.data() || {}
      const created = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || null)
      const user = data.user || {}
      const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim()
      return {
        id: d.id,
        createdAt: created ? new Date(created).toISOString() : '',
        status: data.status || '',
        topic: data.topic || '',
        details: data.details || '',
        preferredContact: data.preferredContact || data.preferredcontact || '',
        consent: typeof data.consent === 'boolean' ? String(data.consent) : (data.consent || ''),
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        fullName,
        email: data.email || '',
        phone: data.phone || '',
        userEmail: user.email || '',
        userName: user.name || '',
        userUid: user.uid || ''
      }
    })
    const csv = toCSV(rows)
    const fname = `help-requests-${new Date().toISOString().slice(0, 10)}.csv`
    downloadCSV(csv, fname)
  } catch (e) {
    console.error('exportHelpRequestsCSV failed', e)
    alert('Could not export help requests. Check Firestore permissions.')
  }
}

const router = useRouter()
const denyRef = ref(null)
const checked = ref(false)

// Firestore
const db = getFirestore()
const functions = getFunctions(undefined, 'australia-southeast1')
// ---- Bulk email (Quick actions) ----
const showBulk = ref(false)
const bulkSubject = ref('')
const bulkMessage = ref('')
const bulkSending = ref(false)
const bulkResult = ref('')
const bulkError = ref('')
const bulkSuccessRef = ref(null)

async function sendBulkEmail() {
  bulkError.value = ''
  bulkResult.value = ''
  if (!bulkSubject.value.trim()) { bulkError.value = 'Subject is required.'; return }
  if (!bulkMessage.value.trim()) { bulkError.value = 'Message is required.'; return }
  try {
    bulkSending.value = true
    const callable = httpsCallable(functions, 'sendBulkEmail')
    const res = await callable({
      subject: bulkSubject.value.trim(),
      text: bulkMessage.value.trim(),
      html: `<p>${bulkMessage.value.trim().replace(/\n/g, '<br>')}</p>`
    })
    const data = res?.data || {}
    if (data.ok) {
      bulkResult.value = `Sent email successfully.`
      bulkSubject.value = ''
      bulkMessage.value = ''
      // Keep the form open briefly to show success, then hide
      await nextTick()
      bulkSuccessRef.value && bulkSuccessRef.value.focus()
      setTimeout(() => {
        showBulk.value = false
        bulkResult.value = ''
      }, 2500)
    } else {
      bulkError.value = data.error || 'Bulk send failed.'
    }
  } catch (e) {
    console.error('sendBulkEmail failed', e)
    bulkError.value = 'Could not send bulk email. Check Cloud Function deployment & permissions.'
  } finally {
    bulkSending.value = false
  }
}

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

// ----- Resources form -----
const newResource = ref({
  title: '',
  url: '',
  audience: '',
  topic: '',
  format: 'Article'
})
const resErrors = ref({ title: '', url: '', audience: '', topic: '', format: '' })
const resTitleRef = ref(null)
const resUrlRef = ref(null)
const resAudienceRef = ref(null)
const resTopicRef = ref(null)
const resFormatRef = ref(null)
const resSuccessRef = ref(null)
const showResCreated = ref(false)

function resetResourceForm() {
  newResource.value = { title: '', url: '', audience: '', topic: '', format: 'Article' }
  resErrors.value = { title: '', url: '', audience: '', topic: '', format: '' }
}
function validateResourceForm() {
  resErrors.value = { title: '', url: '', audience: '', topic: '', format: '' }
  if (!newResource.value.title.trim()) resErrors.value.title = 'Title is required.'
  const url = String(newResource.value.url || '').trim()
  if (!url) resErrors.value.url = 'URL is required.'
  else if (!/^https?:\/\//i.test(url)) resErrors.value.url = 'Enter a valid http(s) URL.'
  if (!newResource.value.audience.trim()) resErrors.value.audience = 'Audience is required.'
  if (!newResource.value.topic.trim()) resErrors.value.topic = 'Topic is required.'
  if (!newResource.value.format.trim()) resErrors.value.format = 'Format is required.'
  return Object.values(resErrors.value).every(v => !v)
}
async function addResource() {
  if (!validateResourceForm()) {
    if (resErrors.value.title) { resTitleRef.value?.focus(); return }
    if (resErrors.value.url) { resUrlRef.value?.focus(); return }
    if (resErrors.value.audience) { resAudienceRef.value?.focus(); return }
    if (resErrors.value.topic) { resTopicRef.value?.focus(); return }
    if (resErrors.value.format) { resFormatRef.value?.focus(); return }
    return
  }
  try {
    const docData = {
      title: sanitize(newResource.value.title.trim()),
      url: String(newResource.value.url).trim(),
      audience: sanitize(newResource.value.audience.trim()),
      topic: sanitize(newResource.value.topic.trim()),
      format: sanitize(newResource.value.format.trim()),
      createdAt: serverTimestamp(),
      createdByEmail: (userEmail.value || 'admin').toLowerCase()
    }
    await addDoc(collection(db, 'resources'), docData)
    showResCreated.value = true
    nextTick(() => resSuccessRef.value?.focus())
    setTimeout(() => { showResCreated.value = false }, 2500)
    resetResourceForm()
  } catch (e) {
    console.error('Failed to add resource', e)
    resErrors.value.title = 'Could not add resource. Try again.'
    resTitleRef.value?.focus()
  }
}

// ----- Providers form -----
const newProvider = ref({
  name: '',
  email: '',
  phone: '',
  region: '',
  type: ''
})
const provErrors = ref({ name: '', email: '', phone: '', region: '', type: '' })
const provNameRef = ref(null)
const provEmailRef = ref(null)
const provPhoneRef = ref(null)
const provRegionRef = ref(null)
const provTypeRef = ref(null)
const provSuccessRef = ref(null)
const showProvCreated = ref(false)

function resetProviderForm() {
  newProvider.value = { name: '', email: '', phone: '', region: '', type: '' }
  provErrors.value = { name: '', email: '', phone: '', region: '', type: '' }
}

function validateProviderForm() {
  provErrors.value = { name: '', email: '', phone: '', region: '', type: '' }
  if (!newProvider.value.name.trim()) provErrors.value.name = 'Name is required.'
  if (!newProvider.value.email.trim()) provErrors.value.email = 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(newProvider.value.email.trim())) provErrors.value.email = 'Enter a valid email address.'
  if (!newProvider.value.phone.trim()) provErrors.value.phone = 'Phone number is required.'
  if (!newProvider.value.region.trim()) provErrors.value.region = 'Region is required.'
  if (!newProvider.value.type.trim()) provErrors.value.type = 'Type is required.'
  return Object.values(provErrors.value).every(v => !v)
}

async function addProvider() {
  if (!validateProviderForm()) {
    if (provErrors.value.name) { provNameRef.value?.focus(); return }
    if (provErrors.value.email) { provEmailRef.value?.focus(); return }
    if (provErrors.value.phone) { provPhoneRef.value?.focus(); return }
    if (provErrors.value.region) { provRegionRef.value?.focus(); return }
    if (provErrors.value.type) { provTypeRef.value?.focus(); return }
    return
  }
  try {
    const docData = {
      name: sanitize(newProvider.value.name.trim()),
      email: String(newProvider.value.email).trim().toLowerCase(),
      phone: String(newProvider.value.phone).trim(),
      region: sanitize(newProvider.value.region.trim()),
      type: sanitize(newProvider.value.type.trim()),
      createdAt: serverTimestamp(),
      createdByEmail: (userEmail.value || 'admin').toLowerCase()
    }
    await addDoc(collection(db, 'providers'), docData)
    showProvCreated.value = true
    nextTick(() => provSuccessRef.value?.focus())
    setTimeout(() => { showProvCreated.value = false }, 2500)
    resetProviderForm()
  } catch (e) {
    console.error('Failed to add provider', e)
    provErrors.value.name = 'Could not add provider. Try again.'
    provNameRef.value?.focus()
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