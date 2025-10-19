<template>
  <main id="main" tabindex="-1">
    <div class="container py-4 py-md-5">
      <header class="mb-4 text-center">
        <h1 class="mb-2" data-page-title>Welcome to YouthConnect</h1>
        <p class="lead mb-0">
          A safe space to learn, join events, and get support. Here’s a quick snapshot of how our community is doing.
        </p>
      </header>

      <section class="row g-3 mb-4" aria-label="Site statistics">
        <div class="col-12 col-md-4">
          <div class="card h-100 text-center">
            <div class="card-body">
              <div class="stat-label">Total Events</div>
              <div class="stat-value" :aria-label="`Total events: ${totalEvents}`">{{ totalEvents }}</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="card h-100 text-center">
            <div class="card-body">
              <div class="stat-label">Resources</div>
              <div class="stat-value" :aria-label="`Total resources: ${totalResources}`">{{ totalResources }}</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="card h-100 text-center">
            <div class="card-body">
              <div class="stat-label">Help Requests</div>
              <div class="stat-value" :aria-label="`Total help requests: ${totalHelpRequests}`">{{ totalHelpRequests }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="row g-3" aria-label="Community charts">
        <div class="col-12 col-lg-6">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h2 class="h6 mb-0">Events by mode</h2>
              <small class="text-muted" aria-live="polite">{{ loadingEvents ? 'Loading…' : '' }}</small>
            </div>
            <div class="card-body">
              <p v-if="!loadingEvents && !eventModeCounts.length" class="text-muted mb-0">No events yet.</p>
              <canvas v-else id="eventsModeChart" role="img" aria-label="Events by mode chart" width="400"
                height="300"></canvas>

              <div v-if="selectedMode" id="events-mode-detail" class="mt-3" role="region"
                :aria-label="`Events for mode ${selectedMode}`">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h3 class="h6 mb-0">Selected mode: {{ selectedMode }}</h3>
                  <button class="btn btn-sm btn-outline-secondary" @click="selectedMode = ''">Clear</button>
                </div>
                <p class="small text-muted" v-if="filteredEvents.length">Showing {{ Math.min(filteredEvents.length, 20)
                  }} of {{ filteredEvents.length }} events.</p>
                <p class="small text-muted" v-else>No events found for this mode.</p>
                <ul class="list-group">
                  <li v-for="ev in filteredEvents.slice(0, 20)" :key="ev.id" class="list-group-item">
                    <div class="fw-semibold">{{ ev.title || 'Untitled event' }}</div>
                    <div class="small text-muted">{{ formatDate(ev.datetime) }} · {{ ev.mode }} · {{ ev.location || '—'
                      }}</div>
                    <div class="small">{{ ev.description || '' }}</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-6">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h2 class="h6 mb-0">Help requests by topic</h2>
              <small class="text-muted" aria-live="polite">{{ loadingHelp ? 'Loading…' : '' }}</small>
            </div>
            <div class="card-body">
              <p v-if="!loadingHelp && !helpTopicCounts.length" class="text-muted mb-0">No help requests yet.</p>
              <canvas v-else id="helpPieChart" role="img" aria-label="Help requests by topic chart" width="400"
                height="300"></canvas>

              <div v-if="selectedTopic" id="help-topic-detail" class="mt-3" role="region"
                :aria-label="`Help requests for ${selectedTopic}`">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h3 class="h6 mb-0">Selected topic: {{ selectedTopic }}</h3>
                  <button class="btn btn-sm btn-outline-secondary" @click="selectedTopic = ''">Clear</button>
                </div>
                <p class="small text-muted" v-if="filteredHelp.length">Showing {{ Math.min(filteredHelp.length, 20) }}
                  of {{ filteredHelp.length }} requests.</p>
                <p class="small text-muted" v-else>No requests found for this topic.</p>
                <ul class="list-group">
                  <li v-for="(req) in filteredHelp.slice(0, 20)" :key="req.id" class="list-group-item">
                    <div class="fw-semibold">{{ req.topic || 'Other' }} <span class="text-muted">• {{
                      (req.createdAt?.toDate ? req.createdAt.toDate() : req.createdAt) ? new
                        Date(req.createdAt?.toDate ? req.createdAt.toDate() : req.createdAt).toLocaleString() : ''
                        }}</span></div>
                    <div class="small">{{ req.details || req.message || '—' }}</div>
                    <div class="small text-muted">Preferred contact: {{ req.preferredContact || req.preferredcontact ||
                      '—' }}</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

const db = getFirestore()

const totalEvents = ref(0)
const totalResources = ref(0)
const totalHelpRequests = ref(0)

const loadingEvents = ref(true)
const loadingHelp = ref(true)
const eventModeCounts = ref([]) 
const helpTopicCounts = ref([]) 

const eventsAll = ref([])
const selectedMode = ref('')
const filteredEvents = computed(() => {
  const m = selectedMode.value
  if (!m) return []
  return eventsAll.value.filter(ev => (ev.mode || '').toLowerCase().includes(m.toLowerCase()))
})

const helpRequestsAll = ref([]) 
const selectedTopic = ref('')
const selectingHelp = ref(false)
const filteredHelp = computed(() => {
  const t = selectedTopic.value
  if (!t) return []
  return helpRequestsAll.value.filter(r => (r.topic || 'Other').toLowerCase() === t.toLowerCase())
})

function titleCase(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/(^|\s|[-_/])(\p{L})/gu, (m, p1, p2) => p1 + p2.toUpperCase())
}

function formatDate(dt) {
  try { return new Date(dt).toLocaleString() } catch { return String(dt || '') }
}

async function loadTotals() {
  const [evSnap, resSnap, helpSnap] = await Promise.all([
    getDocs(collection(db, 'events')),
    getDocs(collection(db, 'resources')),
    getDocs(collection(db, 'help-requests'))
  ])
  totalEvents.value = evSnap.size
  totalResources.value = resSnap.size
  totalHelpRequests.value = helpSnap.size
}

async function loadEventModes() {
  loadingEvents.value = true
  try {
    const snap = await getDocs(collection(db, 'events'))
    const map = new Map()
    const all = []
    snap.docs.forEach(d => {
      const data = d.data() || {}
      all.push({ id: d.id, ...data })
      const raw = (data.mode || '').toString().trim().toLowerCase()
      let label = 'In-person'
      if (raw.includes('online')) label = 'Online'
      else if (raw.includes('hybrid')) label = 'Hybrid'
      map.set(label, (map.get(label) || 0) + 1)
    })
    eventsAll.value = all
    eventModeCounts.value = Array.from(map.entries()).map(([label, count]) => ({ label, count }))
  } finally {
    loadingEvents.value = false
  }
}

async function loadHelpTopics() {
  loadingHelp.value = true
  try {
    const snap = await getDocs(collection(db, 'help-requests'))
    helpRequestsAll.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    const map = new Map()
    snap.docs.forEach(d => {
      const t = titleCase(d.data()?.topic || 'Other')
      map.set(t, (map.get(t) || 0) + 1)
    })
    helpTopicCounts.value = Array.from(map.entries()).map(([label, count]) => ({ label, count }))
  } finally {
    loadingHelp.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadTotals(), loadEventModes(), loadHelpTopics()])
})

import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

let helpChartInstance = null
let eventsChartInstance = null

function renderEventsModeChart() {
  const ctx = document.getElementById('eventsModeChart')
  if (!ctx) return
  if (eventsChartInstance) eventsChartInstance.destroy()

  const labels = eventModeCounts.value.map(r => r.label)
  const data = eventModeCounts.value.map(r => r.count)

  eventsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        label: 'Events',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
        title: { display: true, text: 'Events by Mode' }
      },
      onClick: (evt, elements) => {
        if (!elements || !elements.length) return
        const idx = elements[0].index
        selectedMode.value = labels[idx]
        // Scroll the detail panel into view
        requestAnimationFrame(() => {
          const el = document.getElementById('events-mode-detail')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }
  })
}

function renderHelpPieChart() {
  const ctx = document.getElementById('helpPieChart')
  if (!ctx) return
  if (helpChartInstance) {
    helpChartInstance.destroy()
  }
  const labels = helpTopicCounts.value.map(r => r.label)
  const data = helpTopicCounts.value.map(r => r.count)

  helpChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#20c997', '#fd7e14']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Help Requests by Topic' },
        tooltip: { enabled: true }
      },
      onClick: (evt, elements) => {
        if (!elements || !elements.length) return
        const idx = elements[0].index
        selectedTopic.value = labels[idx]
        selectingHelp.value = true
        requestAnimationFrame(() => {
          const el = document.getElementById('help-topic-detail')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }
  })
}

import { watch } from 'vue'
watch(helpTopicCounts, () => {
  renderHelpPieChart()
})
watch(eventModeCounts, () => {
  renderEventsModeChart()
})
</script>

<style scoped>
.lead {
  max-width: 60ch;
  margin-inline: auto;
}

.stat-label {
  font-size: 0.825rem;
  color: #6c757d;
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1;
}
</style>
