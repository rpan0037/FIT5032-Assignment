<template>
  <div class="container py-4">
    <section class="mb-4">
      <h1 class="mb-3" data-page-title>About YouthConnect</h1>
      <p>
        YouthConnect is a Melbourne-based not‑for‑profit focused on improving youth mental health and wellbeing.
        We combine evidence‑based self‑help tools, peer community, and local resource guidance to support young
        people aged 12–25. Our content is designed with input from mental health professionals and young people
        to be practical, accessible and culturally sensitive.
      </p>
      <p class="mb-0">
        Our goals are simple: improve mental health literacy, reduce barriers to help‑seeking, and create safe,
        moderated spaces for connection. Features like mood tracking, resources by topic, and youth‑friendly events
        help users find the right support at the right time.
      </p>
    </section>

    <section class="mb-4">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h2 class="h6 mb-0">Community Rating</h2>
          <small class="text-muted">Aggregated from user feedback</small>
        </div>
        <div class="card-body">
          <div v-if="!ratings.length" class="text-muted">No ratings yet.</div>
          <div v-else>
            <div class="d-flex align-items-center gap-3 mb-3" aria-describedby="rating-desc">
              <div class="display-6 m-0" aria-hidden="true">{{ average }}</div>
              <div class="fs-4" aria-hidden="true">
                <span v-for="i in 5" :key="i" aria-hidden="true">{{ i <= Math.round(average) ? '★' : '☆' }}</span>
              </div>
              <div class="text-muted" aria-hidden="true">({{ count }} ratings)</div>
              <span id="rating-desc" class="visually-hidden">Average {{ average }} out of 5 based on {{ count }}
                ratings.</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="card">
        <div class="card-header">
          <h2 class="h6 mb-0">Recent Feedback</h2>
        </div>
        <div class="card-body">
          <div v-if="recentComments.length">
            <ul class="list-group list-group-flush">
              <li v-for="(item, index) in recentComments" :key="index" class="list-group-item">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <strong>{{ item.rating }}★</strong>
                </div>
                <p class="mb-0">{{ item.feedback }}</p>
              </li>
            </ul>
          </div>
          <p v-else class="text-muted mb-0">No comments yet.</p>
        </div>
      </div>
    </section>
    <p class="visually-hidden" aria-live="polite" ref="a11yStatus"></p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import ratingsSeed from '@/assets/json/ratings.json'

const LS_KEY = 'ratings_v1'
const ratings = ref([])
const a11yStatus = ref(null)

onMounted(() => {
  const existing = localStorage.getItem(LS_KEY)
  if (existing) {
    ratings.value = JSON.parse(existing)
    nextTick(() => {
      if (a11yStatus.value) {
        const c = ratings.value.length
        const avg = Number((() => {
          let t = 0
          for (const r of ratings.value) t += Number(r.rating || 0)
          return c ? (t / c) : 0
        })()).toFixed(1)
        a11yStatus.value.textContent = c ? `Ratings loaded. Average ${avg} out of 5 from ${c} ratings.` : 'No ratings yet.'
      }
    })
  } else {
    localStorage.setItem(LS_KEY, JSON.stringify(ratingsSeed))
    ratings.value = ratingsSeed
    nextTick(() => {
      if (a11yStatus.value) {
        const c = ratings.value.length
        const avg = Number((() => {
          let t = 0
          for (const r of ratings.value) t += Number(r.rating || 0)
          return c ? (t / c) : 0
        })()).toFixed(1)
        a11yStatus.value.textContent = c ? `Ratings loaded. Average ${avg} out of 5 from ${c} ratings.` : 'No ratings yet.'
      }
    })
  }
})

const count = computed(() => ratings.value.length)
const average = computed(() => {
  if (!ratings.value.length) return 0
  let total = 0
  for (const r of ratings.value) {
    total += Number(r.rating || 0)
  }
  return (total / ratings.value.length).toFixed(1)
})

const recentComments = computed(() => {
  return ratings.value
    .filter(r => (r.feedback || '').trim().length)
    .slice(-5)
    .reverse()
})
</script>

<style scoped>
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
