<template>
  <main id="main" tabindex="-1">
    <div class="container py-3">
      <h1 class="mb-2" data-page-title>Resources</h1>
      <p class="mb-4">
        Explore articles, guides, and self-help tools designed to help you build resilience,
        manage stress, and support your mental wellbeing.
      </p>

      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong>Resources</strong>
          <small class="text-muted" v-if="resourcesLoading" aria-live="polite">Loading…</small>
        </div>
        <div class="card-body">
          <div class="row g-2 mb-2">
            <div class="col" v-for="col in resCols" :key="'res-f-' + col.key">
              <input :placeholder="'Search ' + col.label" class="form-control form-control-sm"
                v-model="resFilters[col.key]" :aria-label="`Filter by ${col.label}`"
                :aria-controls="'resources-table'" />
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-striped align-middle" id="resources-table">
              <caption class="visually-hidden">Filterable list of resources with title, topic, audience, format and
                link.</caption>
              <thead>
                <tr>
                  <th v-for="col in resCols" :key="'res-h-' + col.key" scope="col">
                    <button class="btn btn-link p-0 text-decoration-none"
                      :aria-sort="resSort.key === col.key ? (resSort.dir === 'asc' ? 'ascending' : 'descending') : 'none'"
                      @click="onSort('res', col)" :disabled="!col.sortable">
                      {{ col.label }}
                      <span v-if="resSort.key === col.key">{{ resSort.dir === 'asc' ? '▲' : '▼' }}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in resPaged" :key="row.id">
                  <td>{{ row.title }}</td>
                  <td>{{ row.topic }}</td>
                  <td>{{ row.audience }}</td>
                  <td>{{ row.format }}</td>
                  <td>
                    <a :href="row.url" target="_blank" rel="noopener" v-if="row.url">Open</a>
                    <span v-else class="text-muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <nav class="d-flex justify-content-between align-items-center" aria-label="Resources pagination">
            <small class="text-muted" aria-live="polite">{{ resFiltered.length }} items</small>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: resPage === 1 }">
                <button class="page-link" @click="resGo(resPage - 1)" :disabled="resPage === 1"
                  aria-label="Previous page">Prev</button>
              </li>
              <li class="page-item" v-for="p in resPageCount" :key="'resp' + p" :class="{ active: p === resPage }">
                <button class="page-link" @click="resGo(p)" :aria-current="p === resPage ? 'page' : null"
                  :aria-label="`Go to page ${p}`">{{ p }}</button>
              </li>
              <li class="page-item" :class="{ disabled: resPage === resPageCount }">
                <button class="page-link" @click="resGo(resPage + 1)" :disabled="resPage === resPageCount"
                  aria-label="Next page">Next</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong>Support Services</strong>
          <small class="text-muted" v-if="providersLoading" aria-live="polite">Loading…</small>
        </div>
        <div class="card-body">
          <!-- Column filters -->
          <div class="row g-2 mb-2">
            <div class="col" v-for="col in provCols" :key="'prov-f-' + col.key">
              <input :placeholder="'Search ' + col.label" class="form-control form-control-sm"
                v-model="provFilters[col.key]" :aria-label="`Filter by ${col.label}`"
                :aria-controls="'providers-table'" />
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-striped align-middle" id="providers-table">
              <caption class="visually-hidden">Filterable list of support services with name, type, region, email and
                phone.</caption>
              <thead>
                <tr>
                  <th v-for="col in provCols" :key="'prov-h-' + col.key" scope="col">
                    <button class="btn btn-link p-0 text-decoration-none"
                      :aria-sort="provSort.key === col.key ? (provSort.dir === 'asc' ? 'ascending' : 'descending') : 'none'"
                      @click="onSort('prov', col)" :disabled="!col.sortable">
                      {{ col.label }}
                      <span v-if="provSort.key === col.key">{{ provSort.dir === 'asc' ? '▲' : '▼' }}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in provPaged" :key="row.id">
                  <td>{{ row.name }}</td>
                  <td>{{ row.type }}</td>
                  <td>{{ row.region }}</td>
                  <td>{{ row.email }}</td>
                  <td>{{ row.phone }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <nav class="d-flex justify-content-between align-items-center" aria-label="Support services pagination">
            <small class="text-muted" aria-live="polite">{{ provFiltered.length }} items</small>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: provPage === 1 }">
                <button class="page-link" @click="provGo(provPage - 1)" :disabled="provPage === 1"
                  aria-label="Previous page">Prev</button>
              </li>
              <li class="page-item" v-for="p in provPageCount" :key="'provp' + p" :class="{ active: p === provPage }">
                <button class="page-link" @click="provGo(p)" :aria-current="p === provPage ? 'page' : null"
                  :aria-label="`Go to page ${p}`">{{ p }}</button>
              </li>
              <li class="page-item" :class="{ disabled: provPage === provPageCount }">
                <button class="page-link" @click="provGo(provPage + 1)" :disabled="provPage === provPageCount"
                  aria-label="Next page">Next</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getFirestore, collection, onSnapshot } from 'firebase/firestore'

const db = getFirestore()

const resCols = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'topic', label: 'Topic', sortable: true },
  { key: 'audience', label: 'Audience', sortable: true },
  { key: 'format', label: 'Format', sortable: true },
  { key: 'url', label: 'Link', sortable: false }
]

const resources = ref([])
const resourcesLoading = ref(true)
const resFilters = ref(Object.fromEntries(resCols.map(c => [c.key, ''])))
const resSort = ref({ key: 'title', dir: 'asc' })
const resPage = ref(1)
const PAGE_SIZE = 10

onMounted(() => {
  onSnapshot(collection(db, 'resources'), (snap) => {
    resources.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    resourcesLoading.value = false
    resPage.value = 1
  }, () => { resourcesLoading.value = false })

  onSnapshot(collection(db, 'providers'), (snap) => {
    providers.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    providersLoading.value = false
    provPage.value = 1
  }, () => { providersLoading.value = false })
})

watch(resources, () => { resPage.value = 1 })

const resFiltered = computed(() => {
  const f = resFilters.value
  return resources.value.filter(r => {
    return resCols.every(col => {
      const v = (r[col.key] ?? '').toString().toLowerCase()
      const q = (f[col.key] ?? '').toString().toLowerCase().trim()
      return !q || v.includes(q)
    })
  })
})

const resSorted = computed(() => {
  const arr = [...resFiltered.value]
  const { key, dir } = resSort.value
  arr.sort((a, b) => {
    const av = (a[key] ?? '').toString().toLowerCase()
    const bv = (b[key] ?? '').toString().toLowerCase()
    if (av < bv) return dir === 'asc' ? -1 : 1
    if (av > bv) return dir === 'asc' ? 1 : -1
    return 0
  })
  return arr
})

const resPageCount = computed(() => Math.max(1, Math.ceil(resSorted.value.length / PAGE_SIZE)))
const resPaged = computed(() => {
  const start = (resPage.value - 1) * PAGE_SIZE
  return resSorted.value.slice(start, start + PAGE_SIZE)
})

function onSort(which, col) {
  if (which === 'res') {
    if (!col.sortable) return
    if (resSort.value.key === col.key) {
      resSort.value.dir = resSort.value.dir === 'asc' ? 'desc' : 'asc'
    } else {
      resSort.value.key = col.key
      resSort.value.dir = 'asc'
    }
  } else if (which === 'prov') {
    if (!col.sortable) return
    if (provSort.value.key === col.key) {
      provSort.value.dir = provSort.value.dir === 'asc' ? 'desc' : 'asc'
    } else {
      provSort.value.key = col.key
      provSort.value.dir = 'asc'
    }
  }
}

function resGo(p) {
  if (p < 1 || p > resPageCount.value) return
  resPage.value = p
}

const provCols = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'region', label: 'Region', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Phone', sortable: false }
]

const providers = ref([])
const providersLoading = ref(true)
const provFilters = ref(Object.fromEntries(provCols.map(c => [c.key, ''])))
const provSort = ref({ key: 'name', dir: 'asc' })
const provPage = ref(1)

watch(providers, () => { provPage.value = 1 })

const provFiltered = computed(() => {
  const f = provFilters.value
  return providers.value.filter(r => {
    return provCols.every(col => {
      const v = (r[col.key] ?? '').toString().toLowerCase()
      const q = (f[col.key] ?? '').toString().toLowerCase().trim()
      return !q || v.includes(q)
    })
  })
})

const provSorted = computed(() => {
  const arr = [...provFiltered.value]
  const { key, dir } = provSort.value
  arr.sort((a, b) => {
    const av = (a[key] ?? '').toString().toLowerCase()
    const bv = (b[key] ?? '').toString().toLowerCase()
    if (av < bv) return dir === 'asc' ? -1 : 1
    if (av > bv) return dir === 'asc' ? 1 : -1
    return 0
  })
  return arr
})

const provPageCount = computed(() => Math.max(1, Math.ceil(provSorted.value.length / PAGE_SIZE)))
const provPaged = computed(() => {
  const start = (provPage.value - 1) * PAGE_SIZE
  return provSorted.value.slice(start, start + PAGE_SIZE)
})

function provGo(p) {
  if (p < 1 || p > provPageCount.value) return
  provPage.value = p
}
</script>

<style scoped>
th>button {
  cursor: pointer;
}

th>button[disabled] {
  cursor: default;
  color: inherit;
}

.table thead th {
  white-space: nowrap;
}

.visually-hidden {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
