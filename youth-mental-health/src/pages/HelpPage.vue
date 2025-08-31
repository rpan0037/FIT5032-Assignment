<script setup>
import { ref } from 'vue'

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  contact: 'email',
  topic: '',
  details: '',
  consent: false,
})

const errors = ref({
  firstName: null,
  lastName: null,
  email: null,
  phone: null,
  topic: null,
  details: null,
  consent: null,
})

const showSuccess = ref(false)

const emailRE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRE = /^[0-9+\-()\s]{7,20}$/

const validateFirstName = (onBlur) => {
  const v = formData.value.firstName.trim()
  if (!v) { if (onBlur) errors.value.firstName = 'First name is required.' }
  else if (v.length < 2) { if (onBlur) errors.value.firstName = 'First name must be at least 2 characters.' }
  else { errors.value.firstName = null }
}

const validateLastName = (onBlur) => {
  const v = formData.value.lastName.trim()
  if (!v) { if (onBlur) errors.value.lastName = 'Last name is required.' }
  else if (v.length < 2) { if (onBlur) errors.value.lastName = 'Last name must be at least 2 characters.' }
  else { errors.value.lastName = null }
}

const validateEmail = (onBlur) => {
  const v = formData.value.email.trim()
  if (!v) { if (onBlur) errors.value.email = 'Email is required.' }
  else if (!emailRE.test(v)) { if (onBlur) errors.value.email = 'Enter a valid email address.' }
  else { errors.value.email = null }
}

const validatePhone = (onBlur) => {
  const v = formData.value.phone.trim()
  if (formData.value.contact === 'phone' && !v) {
    if (onBlur) errors.value.phone = 'Phone number is required if preferred contact is phone.'
  } else if (v && !phoneRE.test(v)) {
    if (onBlur) errors.value.phone = 'Enter a valid phone number (digits, +, -, space).'
  } else {
    errors.value.phone = null
  }
}

const validateTopic = (onBlur) => {
  const v = formData.value.topic
  if (!v) { if (onBlur) errors.value.topic = 'Please choose a topic.' }
  else { errors.value.topic = null }
}

const validateDetails = (onBlur) => {
  const v = formData.value.details.trim()
  if (!v) { if (onBlur) errors.value.details = 'Please describe your situation.' }
  else if (v.length < 20) { if (onBlur) errors.value.details = 'Please write at least 20 characters.' }
  else { errors.value.details = null }
}

const validateConsent = (onBlur) => {
  const v = formData.value.consent
  if (!v) { if (onBlur) errors.value.consent = 'You must consent to be contacted.' }
  else { errors.value.consent = null }
}

const validateAllOnBlur = () => {
  validateFirstName(true)
  validateLastName(true)
  validateEmail(true)
  validatePhone(true)
  validateTopic(true)
  validateDetails(true)
  validateConsent(true)
}

function clearForm() {
  formData.value = { firstName: '', lastName: '', email: '', phone: '', contact: 'email', topic: '', details: '', consent: false }
  errors.value = { firstName: null, lastName: null, email: null, phone: null, topic: null, details: null, consent: null }
}

function submitForm() {
  validateAllOnBlur()
  if (
    errors.value.firstName ||
    errors.value.lastName ||
    errors.value.email ||
    errors.value.phone ||
    errors.value.topic ||
    errors.value.details ||
    errors.value.consent
  ) {
    return
  }
  showSuccess.value = true
  setTimeout(() => (showSuccess.value = false), 3500)
  clearForm()
}
</script>

<template>
  <section class="py-4 py-md-5">
    <div class="container">
      <div class="row">
        <div class="col-lg-8 col-md-10 mx-auto">
          <h1 class="h3 text-center mb-3">Get Help</h1>
          <p class="text-muted text-center mb-4">Tell us a bit about what you need. We’ll get back to you shortly.</p>

          <div v-if="showSuccess" class="alert alert-success" role="alert">
            Query received — we’ll get back to you shortly.
          </div>

          <form @submit.prevent="submitForm">
            <!-- Row: First / Last Name -->
            <div class="row mb-3">
              <div class="col-md-6 col-sm-12 mb-3 mb-md-0">
                <label for="firstName" class="form-label">First name</label>
                <input id="firstName" type="text" class="form-control" v-model.trim="formData.firstName"
                  @blur="() => validateFirstName(true)" @input="() => validateFirstName(false)" />
                <div v-if="errors.firstName" class="text-danger">{{ errors.firstName }}</div>
              </div>

              <div class="col-md-6 col-sm-12">
                <label for="lastName" class="form-label">Last name</label>
                <input id="lastName" type="text" class="form-control" v-model.trim="formData.lastName"
                  @blur="() => validateLastName(true)" @input="() => validateLastName(false)" />
                <div v-if="errors.lastName" class="text-danger">{{ errors.lastName }}</div>
              </div>
            </div>

            <!-- Row: Email / Phone (phone optional) -->
            <div class="row mb-3">
              <div class="col-md-6 col-sm-12 mb-3 mb-md-0">
                <label for="email" class="form-label">Email</label>
                <input id="email" type="email" class="form-control" v-model.trim="formData.email"
                  @blur="() => validateEmail(true)" @input="() => validateEmail(false)" />
                <div v-if="errors.email" class="text-danger">{{ errors.email }}</div>
              </div>

              <div class="col-md-6 col-sm-12">
                <label for="phone" class="form-label">Phone <span class="text-muted">(optional)</span></label>
                <input id="phone" type="tel" class="form-control" v-model.trim="formData.phone"
                  @blur="() => validatePhone(true)" @input="() => validatePhone(false)"
                  placeholder="e.g. 0412 345 678" />
                <div v-if="errors.phone" class="text-danger">{{ errors.phone }}</div>
              </div>
            </div>

            <!-- Row: Preferred contact / Topic -->
            <div class="row mb-3">
              <div class="col-md-6 col-sm-12 mb-3 mb-md-0">
                <label class="form-label d-block">Preferred contact</label>
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" id="contact-email" value="email"
                    v-model="formData.contact">
                  <label class="form-check-label" for="contact-email">Email</label>
                </div>
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" id="contact-phone" value="phone"
                    v-model="formData.contact">
                  <label class="form-check-label" for="contact-phone">Phone</label>
                </div>
              </div>

              <div class="col-md-6 col-sm-12">
                <label for="topic" class="form-label">Topic</label>
                <select id="topic" class="form-select" v-model="formData.topic" @blur="() => validateTopic(true)"
                  @change="() => validateTopic(false)">
                  <option value="">-- Choose a topic --</option>
                  <option value="anxiety">Anxiety</option>
                  <option value="low-mood">Low mood / depression</option>
                  <option value="study-stress">Study stress</option>
                  <option value="sleep">Sleep</option>
                  <option value="other">Other</option>
                </select>
                <div v-if="errors.topic" class="text-danger">{{ errors.topic }}</div>
              </div>
            </div>

            <!-- Details -->
            <div class="mb-3">
              <label for="details" class="form-label">Details</label>
              <textarea id="details" rows="4" class="form-control" v-model.trim="formData.details"
                @blur="() => validateDetails(true)" @input="() => validateDetails(false)"></textarea>
              <div v-if="errors.details" class="text-danger">{{ errors.details }}</div>
              <div class="form-text">Please include enough context (min 20 characters).</div>
            </div>

            <!-- Consent -->
            <div class="mb-3">
              <div class="form-check">
                <input id="consent" type="checkbox" class="form-check-input" v-model="formData.consent"
                  @change="() => validateConsent(true)" />
                <label class="form-check-label" for="consent">
                  I consent to YouthConnect contacting me about this request.
                </label>
              </div>
              <div v-if="errors.consent" class="text-danger">{{ errors.consent }}</div>
            </div>

            <!-- Actions -->
            <div class="text-center">
              <button type="submit" class="btn btn-primary me-2">Submit</button>
              <button type="button" class="btn btn-secondary" @click="clearForm">Clear</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
