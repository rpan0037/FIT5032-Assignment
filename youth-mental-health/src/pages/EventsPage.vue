<script setup>
import { ref, computed, watch } from 'vue'
import eventsData from '../assets/json/events.json'

function useLocalStorageReactive(key, initialValue) {
  const raw = localStorage.getItem(key)
  const state = ref(raw ? JSON.parse(raw) : initialValue)

  watch(state, (val) => {
    localStorage.setItem(key, JSON.stringify(val))
  }, { deep: true })
  return state

}

const events = ref(eventsData)

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
</script>

<template>
  <section class="py-4 py-md-5">
    <div class="container">
      <h1 class="h3 mb-4 text-center">Events</h1>

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
            <button class="btn btn-sm btn-primary" @click="register(ev.id)">Register</button>
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
            <button class="btn btn-sm btn-outline-danger" @click="unregister(ev.id)">Unregister</button>
          </li>
          <li v-if="!registered.length" class="list-group-item text-muted">You haven't registered for any events yet.
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
