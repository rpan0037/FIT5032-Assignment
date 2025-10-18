<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import { currentUser } from '@/auth'
import { getFirestore, collection, query, where, limit, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp, getDocs, orderBy } from 'firebase/firestore'

function sanitize(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const db = getFirestore()

// --- Mapbox config/state ---
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
mapboxgl.accessToken = MAPBOX_TOKEN
const mapEl = ref(null)
let map = null
const eventMarkers = new Map()
let routeSourceId = 'ev-route-src'
let routeLayerId = 'ev-route-layer'
const routeInfo = ref(null)
let geocoderCtrl = null
const editingEvent = ref(null)
const geoPick = ref(null)
const mapStatus = ref(null) 

async function initMapOnce() {
  if (map) return
  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [144.9631, -37.8136],
    zoom: 11
  })
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')
  geocoderCtrl = new MapboxGeocoder({
    accessToken: MAPBOX_TOKEN,
    mapboxgl,
    marker: false,
    placeholder: 'Search places…',
    countries: 'AU',
    language: 'en',
    limit: 5,
    types: 'place,locality,poi,address',
    bbox: [112.9211, -43.7405, 153.6387, -10.6682],
    proximity: { longitude: 144.9631, latitude: -37.8136 }
  })
  map.addControl(geocoderCtrl, 'top-left')
  requestAnimationFrame(() => {
    const input = document.querySelector('.mapboxgl-ctrl-geocoder input[type="text"]')
    if (input) {
      input.setAttribute('aria-label', 'Search places on the map')
      input.setAttribute('id', 'map-search')
    }
  })
  geocoderCtrl.on('result', (e) => {
    const [lng, lat] = e.result.center
    geoPick.value = { lng, lat, place: e.result.place_name || '' }
    if (editingEvent.value) {
      const ev = editingEvent.value
      const color = (ev.mode === 'Online' ? '#9b59b6' : '#34a853')
      if (eventMarkers.has(ev.id)) {
        eventMarkers.get(ev.id).setLngLat([lng, lat])
      } else {
        const el = document.createElement('div')
        el.style.width = '14px'
        el.style.height = '14px'
        el.style.borderRadius = '50%'
        el.style.background = color
        el.style.border = '2px solid white'
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map)
        eventMarkers.set(ev.id, marker)
      }
    }
    if (mapStatus.value) {
      const place = e.result.place_name || ''
      mapStatus.value.textContent = place ? `Map centered on ${place}.` : 'Map updated.'
    }
    map.flyTo({ center: [lng, lat], zoom: 14 })
  })
  map.on('load', () => {
    if (!map.getSource(routeSourceId)) {
      map.addSource(routeSourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    }
    if (!map.getLayer(routeLayerId)) {
      map.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeSourceId,
        paint: { 'line-color': '#1da1f2', 'line-width': 5, 'line-opacity': 0.9 }
      })
    }
  })
}

async function showEventOnMap(ev) {
  try {
    if (!ev || !ev.location) {
      alert('This event has no location text to search.');
      return;
    }
    await initMapOnce();
    if (geocoderCtrl) {
      geocoderCtrl.setInput(ev.location);
      geocoderCtrl.query(ev.location);
      if (mapStatus.value) {
        mapStatus.value.textContent = `Searching the map for: ${ev.location}`
      }
    }
  } catch (e) {
    console.error('showEventOnMap failed', e);
    alert('Could not show this event on the map.');
  }
}

async function routeToEvent(ev) {
  try {
    if (!ev || !ev.location) {
      alert('This event has no location to route to.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ev.location)}`;
    window.open(url, '_blank', 'noopener');
  } catch (e) {
    console.error('routeToEvent failed', e);
    alert('Could not open directions.');
  }
}

const events = ref([])
let stopEventsListener = null

onMounted(() => {
  const q = query(collection(db, 'events'), orderBy('datetime', 'asc'))
  stopEventsListener = onSnapshot(q, (snap) => {
    events.value = snap.docs.map(d => ({ id: d.data().id, ...d.data() }))
  }, (err) => {
    console.error('events listener error', err)
  })
  initMapOnce().catch(() => { })
})

onBeforeUnmount(() => {
  if (typeof stopEventsListener === 'function') stopEventsListener()
})

const registeredIds = ref([])
const regsLoading = ref(false)
const regsError = ref('')
let stopRegsListener = null

function isRegistered(id) {
  return registeredIds.value.includes(id)
}

watch(() => currentUser.value && currentUser.value.id, async (uid) => {
  if (typeof stopRegsListener === 'function') { stopRegsListener(); stopRegsListener = null }

  registeredIds.value = []
  regsError.value = ''

  if (!uid) return

  try {
    regsLoading.value = true
    const q = query(collection(db, 'event-registrations'), where('uid', '==', uid))
    stopRegsListener = onSnapshot(q, (snap) => {
      registeredIds.value = snap.docs.map(d => d.data().eventId)
      regsLoading.value = false
    }, (err) => {
      console.error('registrations listener error', err)
      regsError.value = 'Could not load your registrations.'
      regsLoading.value = false
    })
  } catch (e) {
    console.error('failed to subscribe registrations', e)
    regsError.value = 'Could not load your registrations.'
    regsLoading.value = false
  }
}, { immediate: true })

async function register(id) {
  if (!currentUser.value || !currentUser.value.id) {
    alert('Please log in to register for events.')
    return
  }
  if (isRegistered(id)) return
  try {
    await addDoc(collection(db, 'event-registrations'), {
      uid: currentUser.value.id,
      email: (currentUser.value.email || '').toLowerCase(),
      eventId: id,
      createdAt: serverTimestamp()
    })
  } catch (e) {
    console.error('Failed to register for event', e)
    alert('Could not register. Please try again.')
  }
}

async function unregister(id) {
  if (!currentUser.value || !currentUser.value.id) return
  try {
    const q = query(
      collection(db, 'event-registrations'),
      where('uid', '==', currentUser.value.id),
      where('eventId', '==', id),
      limit(1)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
      await deleteDoc(doc(db, 'event-registrations', snap.docs[0].id))
    }
  } catch (e) {
    console.error('Failed to unregister from event', e)
    alert('Could not unregister. Please try again.')
  }
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

async function addEvent() {
  if (!validateAdminForm()) return
  const ev = {
    id: Date.now(),
    title: sanitize(newEvent.value.title.trim()),
    description: sanitize(newEvent.value.description.trim()),
    datetime: newEvent.value.datetime.trim(),
    mode: newEvent.value.mode.trim(),
    location: sanitize(newEvent.value.location.trim()),
    createdAt: serverTimestamp(),
    createdByEmail: (currentUser.value?.email || '').toLowerCase()
  }
  try {
    await addDoc(collection(db, 'events'), ev)
    newEvent.value = { title: '', description: '', datetime: '', mode: 'Online', location: '' }
    errors.value = { title: '', datetime: '', mode: '', location: '' }
  } catch (e) {
    console.error('Failed to add event', e)
    alert('Could not add event. Please try again.')
  }
}

async function deleteEvent(id) {
  try {
    const q = query(collection(db, 'events'), where('id', '==', id), limit(1))
    const snap = await getDocs(q)
    if (!snap.empty) {
      await deleteDoc(doc(db, 'events', snap.docs[0].id))
    }
  } catch (e) {
    console.error('Failed to delete event', e)
    alert('Could not delete event. Please try again.')
  }
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
                  <input id="evLocation" type="text" class="form-control" v-model.trim="newEvent.location" placeholder="e.g., 700 Collins St, Docklands VIC (required for In-person/Hybrid)" />
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
        <div v-if="regsLoading" class="small text-muted mb-2">Loading your registrations…</div>
        <div v-if="regsError" class="alert alert-warning" role="alert">{{ regsError }}</div>
        <ul class="list-group">
          <li v-for="ev in upcoming" :key="ev.id"
            class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-semibold">{{ ev.title }}</div>
              <div class="small">{{ ev.description }}</div>
              <div class="small text-muted">{{ fmt(ev.datetime) }} · {{ ev.mode }} · {{ ev.location }}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-outline-secondary"
                :disabled="(ev.mode || '').toLowerCase().includes('online')" @click="showEventOnMap(ev)"
                :aria-controls="'map'" :aria-label="`Show ${ev.title} on the map: ${ev.location}`">Show on map</button>
              <button class="btn btn-sm btn-outline-secondary"
                :disabled="(ev.mode || '').toLowerCase().includes('online')" @click="routeToEvent(ev, 'walking')"
                :aria-label="`Open Google Maps directions to ${ev.location} for ${ev.title}`">Directions</button>
              <button v-if="!isAdmin" class="btn btn-sm btn-primary" @click="register(ev.id)">Register</button>
              <button v-else class="btn btn-sm btn-outline-danger" @click="deleteEvent(ev.id)">Delete</button>
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
              <button class="btn btn-sm btn-outline-secondary"
                :disabled="(ev.mode || '').toLowerCase().includes('online')" @click="showEventOnMap(ev)"
                :aria-controls="'map'" :aria-label="`Show ${ev.title} on the map: ${ev.location}`">Show on map</button>
              <button class="btn btn-sm btn-outline-secondary"
                :disabled="(ev.mode || '').toLowerCase().includes('online')" @click="routeToEvent(ev, 'walking')"
                :aria-label="`Open Google Maps directions to ${ev.location} for ${ev.title}`">Directions</button>
              <button v-if="!isAdmin" class="btn btn-sm btn-outline-danger"
                @click="unregister(ev.id)">Unregister</button>
              <button v-else class="btn btn-sm btn-outline-danger" @click="deleteEvent(ev.id)">Delete</button>
            </div>
          </li>
          <li v-if="!registered.length" class="list-group-item text-muted">You haven't registered for any events yet.
          </li>
        </ul>
      </div>
      <div class="mt-4">
        <div ref="mapEl" id="map" role="region" aria-label="Map of event locations"
          style="height: 420px; border-radius: 12px; overflow: hidden;"></div>
        <p class="visually-hidden" aria-live="polite" ref="mapStatus"></p>
        <div class="row g-2 mt-2">
          <div class="col-12 col-md-6" v-if="routeInfo">
            <div class="card p-2 small">
              <div>Route: {{ routeInfo.mode }} • ~{{ routeInfo.etaMin }} min • {{ routeInfo.distanceKm }} km</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
