<template>
  <div class="container py-4">
    <section class="mb-4">
      <h2 class="mb-3">About YouthConnect</h2>
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
          <h3 class="h6 mb-0">Community Rating</h3>
          <small class="text-muted">Aggregated from user feedback</small>
        </div>
        <div class="card-body">
          <div v-if="!ratings.length" class="text-muted">No ratings yet.</div>
          <div v-else>
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="display-6 m-0">{{ average }}</div>
              <div class="fs-4" aria-label="Average rating">
                <span v-for="i in 5" :key="i">{{ i <= Math.round(average) ? '★' : '☆' }}</span>
              </div>
              <div class="text-muted">({{ count }} ratings)</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="card">
        <div class="card-header">
          <h3 class="h6 mb-0">Recent Feedback</h3>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ratingsSeed from '@/assets/json/ratings.json'

const LS_KEY = 'ratings_v1'
const ratings = ref([])

onMounted(() => {
  const existing = localStorage.getItem(LS_KEY)
  if (existing) {
    ratings.value = JSON.parse(existing)
  } else {
    localStorage.setItem(LS_KEY, JSON.stringify(ratingsSeed))
    ratings.value = ratingsSeed
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
</style>
