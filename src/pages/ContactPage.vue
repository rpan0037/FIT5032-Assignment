<template>
  <div class="container py-4">
    <div class="row mb-4">
      <div class="col-12 col-lg-8">
        <h1 class="mb-2" data-page-title>Contact Us</h1>
        <p class="mb-3">
          Have questions or feedback? Reach out and our team will be glad to assist you. We’re here to listen and
          support.
        </p>
        <ul class="list-unstyled mb-0">
          <li class="mb-2"><strong>Email:</strong> <a
              href="mailto:support@youthconnect.org.au">support@youthconnect.org.au</a></li>
          <li class="mb-2"><strong>Phone:</strong> <a href="tel:+61390001234"
              aria-label="Call zero three nine triple zero one two three four">(03) 9000 1234</a></li>
          <li class="mb-2"><strong>Hours:</strong> Mon–Fri, 9:00am–5:00pm (AEST)</li>
        </ul>
      </div>
      <div class="col-12 col-lg-4 mt-3 mt-lg-0">
        <div class="p-3 border rounded-3 bg-light h-100">
          <h2 class="h6">If you’re in crisis</h2>
          <p class="mb-1 small">Call <strong>000</strong> for emergencies.</p>
          <p class="mb-0 small">Lifeline: 13 11 14 · Beyond Blue: 1300 22 4636</p>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header">
        <h2 class="h6 mb-0">Share Your Experience</h2>
      </div>
      <div class="card-body">
        <div v-if="showSuccess" class="alert alert-success" role="alert" aria-live="assertive" tabindex="-1"
          ref="successRef">
          Thanks for sharing your experience. We’ve received your message.
        </div>

        <form @submit.prevent="onSubmit" novalidate>
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label for="score" class="form-label">Your rating (1–5)</label>
              <select id="score" ref="scoreSelect" class="form-select" v-model.number="rating.score"
                @blur="validateScore" required :aria-invalid="errors.score ? 'true' : 'false'"
                :aria-describedby="errors.score ? 'score-error score-help' : 'score-help'">
                <option disabled value="">Select…</option>
                <option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="n">{{ n }}</option>
              </select>
              <p id="score-help" class="form-text small text-muted">Select 1 for poor, 5 for excellent.</p>
              <div v-if="errors.score" id="score-error" class="text-danger small mt-1" role="alert">{{ errors.score }}
              </div>
            </div>

            <div class="col-12">
              <label for="comment" class="form-label">Comment (optional)</label>
              <textarea id="comment" class="form-control" rows="4" v-model.trim="rating.comment"
                placeholder="What worked well? What can we improve?" aria-describedby="comment-help"></textarea>
              <p id="comment-help" class="form-text small text-muted">Please avoid personal or identifying details.</p>
            </div>

            <div class="col-12 d-flex gap-2">
              <button type="submit" class="btn btn-primary">Submit rating</button>
              <button type="button" class="btn btn-secondary" @click="clearForm">Clear</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>

import { ref, nextTick } from 'vue'

function sanitize(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const rating = ref({ score: '', comment: '' })
const errors = ref({ score: '' })
const showSuccess = ref(false)
const successRef = ref(null)
const scoreSelect = ref(null)

function validateScore() {
  const s = Number(rating.value.score)
  const ok = Number.isFinite(s) && s >= 1 && s <= 5
  errors.value.score = ok ? '' : 'Please select a rating between 1 and 5.'
}

function onSubmit() {
  validateScore()
  if (errors.value.score) {
    scoreSelect.value?.focus()
    return
  }

  const newEntry = {
    rating: rating.value.score,
    feedback: sanitize(rating.value.comment)
  }
  const existing = JSON.parse(localStorage.getItem('ratings_v1') || '[]')
  existing.push(newEntry)
  localStorage.setItem('ratings_v1', JSON.stringify(existing))
  showSuccess.value = true
  nextTick(() => successRef.value && successRef.value.focus())
  rating.value = { score: '', comment: '' }
}

function clearForm() {
  rating.value = { score: '', comment: '' }
  errors.value = { score: '' }
  showSuccess.value = false
}
</script>

<style scoped>
</style>
