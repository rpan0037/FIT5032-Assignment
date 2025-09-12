<script setup>
import { ref, computed, watch } from 'vue'
import eventsData from '../assets/json/events.json'
import { currentUser } from '@/auth'

function sanitize (s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function useLocalStorageReactive(key, initialValue) {
  const raw = localStorage.getItem(key)
  const state = ref(raw ? JSON.parse(raw) : initialValue)

  watch(state, (val) => {
    localStorage.setItem(key, JSON.stringify(val))
  }, { deep: true })
  return state

}

const events = useLocalStorageReactive('events_v1', eventsData)
const registeredIds = useLocalStorageReactive('registeredEvents', [])

function isRegistered(id) {
  return registeredIds.value.includes(id)
}
function register(id) {
  if (!isRegistered(id)) registeredIds.value.push(id)
}
function unregister(id) {
  registeredIds.value = registeredIds.value.filter(x => x !== id)
}

function fmt(dt) {
  try { return new Date(dt).toLocaleString() } catch { return dt }
}

const upcoming = computed(() => events.value.filter(e => !isRegistered(e.id)))
const registered = computed(() => events.value.filter(e => isRegistered(e.id)))

const isAdmin = computed(() => (currentUser.value && currentUser.value.role === 'admin'))

const newEvent = ref({
  title: '',
  description: '',
  datetime: '',
  mode: 'Online',
  location: ''
})
const errors = ref({ title: '', datetime: '', mode: '', location: '' })

function validateAdminForm() {
  errors.value.title = newEvent.value.title.trim().length ? '' : 'Title is required.'
  errors.value.datetime = newEvent.value.datetime.trim().length ? '' : 'Date & time is required.'
  errors.value.mode = newEvent.value.mode.trim().length ? '' : 'Mode is required.'
  errors.value.location = newEvent.value.location.trim().length ? '' : 'Location is required.'
  return !(errors.value.title || errors.value.datetime || errors.value.mode || errors.value.location)
}

function addEvent() {
  if (!validateAdminForm()) return
  const ev = {
    id: Date.now(),
    title: sanitize(newEvent.value.title.trim()),
    description: sanitize(newEvent.value.description.trim()),
    datetime: newEvent.value.datetime.trim(),
    mode: newEvent.value.mode.trim(),
    location: sanitize(newEvent.value.location.trim())
  }
  events.value.push(ev)
  localStorage.setItem('events_v1', JSON.stringify(events.value))

  newEvent.value = { title: '', description: '', datetime: '', mode: 'Online', location: '' }
  errors.value = { title: '', datetime: '', mode: '', location: '' }
}

function deleteEvent(id) {
  events.value = events.value.filter(ev => ev.id !== id)
  localStorage.setItem('events_v1', JSON.stringify(events.value))
}
</script>

<template>
  <section class="py-4 py-md-5">
    <div class="container">
      <h1 class="h3 mb-4 text-center">Events</h1>

      <div v-if="isAdmin" class="mb-4">
        <div class="card">
          <div class="card-header">
            <h2 class="h6 mb-0">Admin: Manage Events</h2>
          </div>
          <div class="card-body">
            <form @submit.prevent="addEvent" novalidate>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label" for="evTitle">Title</label>
                  <input id="evTitle" type="text" class="form-control" v-model.trim="newEvent.title" />
                  <div v-if="errors.title" class="text-danger small mt-1">{{ errors.title }}</div>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label" for="evDatetime">Date & Time</label>
                  <input id="evDatetime" type="datetime-local" class="form-control" v-model="newEvent.datetime" />
                  <div v-if="errors.datetime" class="text-danger small mt-1">{{ errors.datetime }}</div>
                </div>
                <div class="col-12">
                  <label class="form-label" for="evDesc">Description (optional)</label>
                  <textarea id="evDesc" class="form-control" rows="2" v-model.trim="newEvent.description" placeholder="Brief details..."></textarea>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label" for="evMode">Mode</label>
                  <select id="evMode" class="form-select" v-model="newEvent.mode">
                    <option>Online</option>
                    <option>In-person</option>
                    <option>Hybrid</option>
                  </select>
                  <div v-if="errors.mode" class="text-danger small mt-1">{{ errors.mode }}</div>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label" for="evLocation">Location</label>
                  <input id="evLocation" type="text" class="form-control" v-model.trim="newEvent.location" placeholder="e.g., Monash University or Zoom" />
                  <div v-if="errors.location" class="text-danger small mt-1">{{ errors.location }}</div>
                </div>
                <div class="col-12 d-flex gap-2">
                  <button type="submit" class="btn btn-primary">Add event</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

            <!-- 1) Upcoming Events -->
        <div class="mb-4">
        <h2 class="h5">Upcoming Events</h2>
        <ul class="list-group">
          <li v-for="ev in upcoming" :key="ev.id"
            class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-semibold">{{ ev.title }}</div>
              <div class="small">{{ ev.description }}</div>
              <div class="small text-muted">{{ fmt(ev.datetime) }} · {{ ev.mode }} · {{ ev.location }}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button v-if="!isAdmin" class="btn btn-sm btn-primary" @click="register(ev.id)">Register</button>
              <div v-if="isAdmin" class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-primary" @click="register(ev.id)">Register</button>
                <button class="btn btn-sm btn-outline-danger" @click="deleteEvent(ev.id)">Delete</button>
              </div>
            </div>
          </li>
          <li v-if="!upcoming.length" class="list-group-item text-muted">No upcoming events.</li>
        </ul>
      </div>

      <!-- 2) Registered Events -->
      <div class="mb-4">
        <h2 class="h5">Registered Events</h2>
        <ul class="list-group">
          <li v-for="ev in registered" :key="ev.id"
            class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-semibold">{{ ev.title }}</div>
              <div class="small">{{ ev.description }}</div>
              <div class="small text-muted">{{ fmt(ev.datetime) }} · {{ ev.mode }} · {{ ev.location }}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button v-if="!isAdmin" class="btn btn-sm btn-outline-danger" @click="unregister(ev.id)">Unregister</button>
              <div v-if="isAdmin" class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-outline-danger" @click="unregister(ev.id)">Unregister</button>
                <button class="btn btn-sm btn-outline-danger" @click="deleteEvent(ev.id)">Delete</button>
              </div>
            </div>
          </li>
          <li v-if="!registered.length" class="list-group-item text-muted">You haven't registered for any events yet.
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
