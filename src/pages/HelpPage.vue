<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { getFirestore, collection, addDoc, serverTimestamp, getCountFromServer } from 'firebase/firestore'
import { currentUser } from '@/auth.js'

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
const submitting = ref(false)
const submitError = ref('')

const firstNameRef = ref(null)
const lastNameRef = ref(null)
const emailRef = ref(null)
const phoneRef = ref(null)
const topicRef = ref(null)
const detailsRef = ref(null)
const consentRef = ref(null)
const successRef = ref(null)

const db = getFirestore()
const reqCount = ref(0)

onMounted(async () => {
  try {
    const cRef = collection(db, 'help-requests')
    const snapshot = await getCountFromServer(cRef)
    reqCount.value = snapshot.data().count || 0
  } catch (e) {
    console.error('Failed to load request count', e)
    reqCount.value = 0
  }
})

const emailRE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRE = /^[0-9+\-()\s]{7,20}$/

const EMAIL_ENDPOINT = "https://australia-southeast1-fit5032-week6-651ed.cloudfunctions.net/sendEmail";

async function sendEmail({ to, subject, html, text, cc, bcc, replyTo, fromName }) {
  const resp = await fetch(EMAIL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html, text, cc, bcc, replyTo, fromName })
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.ok) {
    throw new Error(data?.error || `HTTP ${resp.status}`);
  }
  return data;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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

async function submitForm() {
  // run validations
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
    if (errors.value.firstName) { firstNameRef.value?.focus(); return }
    if (errors.value.lastName) { lastNameRef.value?.focus(); return }
    if (errors.value.email) { emailRef.value?.focus(); return }
    if (errors.value.phone) { phoneRef.value?.focus(); return }
    if (errors.value.topic) { topicRef.value?.focus(); return }
    if (errors.value.details) { detailsRef.value?.focus(); return }
    if (errors.value.consent) { consentRef.value?.focus(); return }
    return
  }

  if (submitting.value) return
  submitting.value = true
  submitError.value = ''

  try {
    const db = getFirestore()
    const userInfo = currentUser?.value
      ? { uid: currentUser.value.id || currentUser.value.uid, email: currentUser.value.email, name: currentUser.value.name || '' }
      : null

    await addDoc(collection(db, 'help-requests'), {
      firstName: formData.value.firstName.trim(),
      lastName: formData.value.lastName.trim(),
      email: formData.value.email.trim(),
      phone: formData.value.phone.trim(),
      preferredContact: formData.value.contact,
      topic: formData.value.topic,
      details: formData.value.details.trim(),
      consent: !!formData.value.consent,
      status: 'new',
      createdAt: serverTimestamp(),
      user: userInfo
    })

    try {
      const fullName = `${formData.value.firstName.trim()} ${formData.value.lastName.trim()}`.trim();
      const adminInbox = "rpandia99@gmail.com"; // update if needed

      const adminHtml = `
        <h2>New Help Request</h2>
        <p><strong>Name:</strong> ${escapeHtml(fullName || "N/A")}</p>
        <p><strong>Email:</strong> ${escapeHtml(formData.value.email.trim())}</p>
        <p><strong>Phone:</strong> ${escapeHtml(formData.value.phone.trim() || "N/A")}</p>
        <p><strong>Preferred contact:</strong> ${escapeHtml(formData.value.contact)}</p>
        <p><strong>Topic:</strong> ${escapeHtml(formData.value.topic)}</p>
        <p><strong>Details:</strong></p>
        <pre style="white-space:pre-wrap">${escapeHtml(formData.value.details.trim())}</pre>
      `;

      await sendEmail({
        to: adminInbox,
        subject: `Help request: ${formData.value.subject || formData.value.topic || "General enquiry"}`,
        html: adminHtml,
        text:
          `New Help Request\n\n` +
          `Name: ${fullName || "N/A"}\n` +
          `Email: ${formData.value.email.trim()}\n` +
          `Phone: ${formData.value.phone.trim() || "N/A"}\n` +
          `Preferred contact: ${formData.value.contact}\n` +
          `Topic: ${formData.value.topic}\n\n` +
          `${formData.value.details.trim()}\n`,
        replyTo: formData.value.email.trim(),
        fromName: "Youth Health (Help)"
      });

      const userHtml = `
        <p>Hi ${escapeHtml(fullName || "there")},</p>
        <p>We’ve received your help request and will get back to you shortly.</p>
        <p><strong>Summary of your submission:</strong></p>
        <ul>
          <li><strong>Preferred contact:</strong> ${escapeHtml(formData.value.contact)}</li>
          <li><strong>Topic:</strong> ${escapeHtml(formData.value.topic)}</li>
        </ul>
        <p><strong>Your message:</strong></p>
        <pre style="white-space:pre-wrap">${escapeHtml(formData.value.details.trim())}</pre>
        <p>— <strong>Youth Health Support</strong></p>
      `;

      await sendEmail({
        to: (currentUser?.value?.email || formData.value.email.trim()),
        subject: "We’ve received your help request",
        html: userHtml,
        text:
          `Hi ${fullName || "there"},\n\n` +
          `We’ve received your help request and will get back to you shortly.\n\n` +
          `Preferred contact: ${formData.value.contact}\n` +
          `Topic: ${formData.value.topic}\n\n` +
          `Your message:\n${formData.value.details.trim()}\n\n` +
          `— Youth Health Support\n`,
        replyTo: adminInbox,
        fromName: "Youth Health Support"
      });
    } catch (e) {
      console.error("Failed to send emails via Cloud Function", e);
      // Do not block UX if email fails
    }

    showSuccess.value = true
    nextTick(() => { successRef.value?.focus() })
    setTimeout(() => (showSuccess.value = false), 3500)
    clearForm()
  } catch (e) {
    console.error('Failed to submit help request', e)
    submitError.value = 'Sorry, we could not submit your request. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="py-4 py-md-5">
    <div class="container">
      <div class="row">
        <div class="col-lg-8 col-md-10 mx-auto">
          <h1 class="h3 text-center mb-3">Get Help</h1>
          <p class="text-muted text-center mb-4">Tell us a bit about what you need. We’ll get back to you shortly.</p>

          <div v-if="showSuccess" class="alert alert-success" role="alert" aria-live="assertive" tabindex="-1"
            ref="successRef">
            Query received — we’ll get back to you shortly.
          </div>
          <div v-if="submitError" class="alert alert-danger" role="alert" aria-live="polite">{{ submitError }}</div>

          <form @submit.prevent="submitForm">
            <!-- Row: First / Last Name -->
            <div class="row mb-3">
              <div class="col-md-6 col-sm-12 mb-3 mb-md-0">
                <label for="firstName" class="form-label">First name</label>
                <input id="firstName" ref="firstNameRef" type="text" class="form-control"
                  v-model.trim="formData.firstName" @blur="() => validateFirstName(true)"
                  @input="() => validateFirstName(false)" required :aria-invalid="errors.firstName ? 'true' : 'false'"
                  :aria-describedby="errors.firstName ? 'err-firstName' : null" />
                <div v-if="errors.firstName" id="err-firstName" class="text-danger" role="alert">{{ errors.firstName }}
                </div>
              </div>

              <div class="col-md-6 col-sm-12">
                <label for="lastName" class="form-label">Last name</label>
                <input id="lastName" ref="lastNameRef" type="text" class="form-control" v-model.trim="formData.lastName"
                  @blur="() => validateLastName(true)" @input="() => validateLastName(false)" required
                  :aria-invalid="errors.lastName ? 'true' : 'false'"
                  :aria-describedby="errors.lastName ? 'err-lastName' : null" />
                <div v-if="errors.lastName" id="err-lastName" class="text-danger" role="alert">{{ errors.lastName }}
                </div>
              </div>
            </div>

            <!-- Row: Email / Phone (phone optional) -->
            <div class="row mb-3">
              <div class="col-md-6 col-sm-12 mb-3 mb-md-0">
                <label for="email" class="form-label">Email</label>
                <input id="email" ref="emailRef" type="email" class="form-control" v-model.trim="formData.email"
                  @blur="() => validateEmail(true)" @input="() => validateEmail(false)" required
                  :aria-invalid="errors.email ? 'true' : 'false'"
                  :aria-describedby="errors.email ? 'err-email' : null" />
                <div v-if="errors.email" id="err-email" class="text-danger" role="alert">{{ errors.email }}</div>
              </div>

              <div class="col-md-6 col-sm-12">
                <label for="phone" class="form-label">Phone <span class="text-muted">(optional)</span></label>
                <input id="phone" ref="phoneRef" type="tel" class="form-control" v-model.trim="formData.phone"
                  @blur="() => validatePhone(true)" @input="() => validatePhone(false)" placeholder="e.g. 0412 345 678"
                  :aria-invalid="errors.phone ? 'true' : 'false'"
                  :aria-describedby="errors.phone ? 'err-phone' : null" />
                <div v-if="errors.phone" id="err-phone" class="text-danger" role="alert">{{ errors.phone }}</div>
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
                    v-model="formData.contact" ref="phoneRef">
                  <label class="form-check-label" for="contact-phone">Phone</label>
                </div>
              </div>

              <div class="col-md-6 col-sm-12">
                <label for="topic" class="form-label">Topic</label>
                <select id="topic" ref="topicRef" class="form-select" v-model="formData.topic"
                  @blur="() => validateTopic(true)" @change="() => validateTopic(false)" required
                  :aria-invalid="errors.topic ? 'true' : 'false'" :aria-describedby="errors.topic ? 'err-topic' : null">
                  <option value="">-- Choose a topic --</option>
                  <option value="anxiety">Anxiety</option>
                  <option value="low-mood">Low mood / depression</option>
                  <option value="study-stress">Study stress</option>
                  <option value="sleep">Sleep</option>
                  <option value="other">Other</option>
                </select>
                <div v-if="errors.topic" id="err-topic" class="text-danger" role="alert">{{ errors.topic }}</div>
              </div>
            </div>

            <!-- Details -->
            <div class="mb-3">
              <label for="details" class="form-label">Details</label>
              <textarea id="details" ref="detailsRef" rows="4" class="form-control" v-model.trim="formData.details"
                @blur="() => validateDetails(true)" @input="() => validateDetails(false)" required
                aria-describedby="details-help" :aria-invalid="errors.details ? 'true' : 'false'"></textarea>
              <div v-if="errors.details" id="err-details" class="text-danger" role="alert">{{ errors.details }}</div>
              <div id="details-help" class="form-text">Please include enough context (min 20 characters).</div>
            </div>

            <!-- Consent -->
            <div class="mb-3">
              <div class="form-check">
                <input id="consent" ref="consentRef" type="checkbox" class="form-check-input" v-model="formData.consent"
                  @change="() => validateConsent(true)" required :aria-invalid="errors.consent ? 'true' : 'false'"
                  :aria-describedby="errors.consent ? 'err-consent' : null" />
                <label class="form-check-label" for="consent">
                  I consent to YouthConnect contacting me about this request.
                </label>
              </div>
              <div v-if="errors.consent" id="err-consent" class="text-danger" role="alert">{{ errors.consent }}</div>
            </div>

            <!-- Actions -->
            <div class="text-center">
              <button type="submit" class="btn btn-primary me-2" :disabled="submitting">{{ submitting ? 'Submitting..' :
                'Submit' }}</button>
              <button type="button" class="btn btn-secondary" @click="clearForm">Clear</button>
            </div>
          </form>
          <p class="text-muted small mt-3 text-center" aria-live="polite">
            We’ve received <strong>{{ reqCount }}</strong> help requests so far.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
