import { ref } from 'vue'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'
import { getFirestore, collection, query, where, limit, getDocs, doc, setDoc } from 'firebase/firestore'

// --- Firebase init  ---
const firebaseConfig = {
  apiKey: 'AIzaSyD9PtANKwT_PZbvy7CzxUL8M_hfqxp2t-g',
  authDomain: 'fit5032-week6-651ed.firebaseapp.com',
  projectId: 'fit5032-week6-651ed',
  storageBucket: 'fit5032-week6-651ed.firebasestorage.app',
  messagingSenderId: '121831707028',
  appId: '1:121831707028:web:4af3b3dad5ed23cc677f81'
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)


export const currentUser = ref(JSON.parse(localStorage.getItem('currentUser')) || null)
export const isAuthenticated = ref(!!currentUser.value)

// Fetch role/displayName by email from Firestore collection 'user-role'
async function fetchRoleByEmail (email) {
  try {
    const q = query(
      collection(db, 'user-role'),
      where('email', '==', (email || '').toLowerCase()),
      limit(1)
    )
    const snap = await getDocs(q)
    if (snap.empty) return { role: 'user', displayName: '' }
    const data = snap.docs[0].data()
    return {
      role: data.role || 'user',
      displayName: data.displayName || ''
    }
  } catch (e) {
    console.error('fetchRoleByEmail failed', e)
    return { role: 'user', displayName: '' }
  }
}

// Upsert a role row for a given email (use after signup if needed)
export async function ensureUserRoleByEmail (email, role = 'user', displayName = '') {
  try {
    const ref = doc(collection(db, 'user-role')) // random doc id; we match by email field
    await setDoc(ref, {
      email: (email || '').toLowerCase(),
      role,
      displayName
    })
  } catch (e) {
    console.error('ensureUserRoleByEmail failed', e)
  }
}

// Keep Vue state in sync with Firebase auth state (set base state first, then enrich with role)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Set base auth state immediately so router guards don't block first navigation
    const base = {
      id: user.uid,
      name: user.displayName || user.email,
      email: user.email,
      role: 'user'
    }
    currentUser.value = base
    localStorage.setItem('currentUser', JSON.stringify(base))
    isAuthenticated.value = true

    // Enrich with Firestore role/displayName asynchronously
    try {
      const { role, displayName } = await fetchRoleByEmail(user.email)
      const updated = {
        ...base,
        name: displayName || base.name,
        role
      }
      currentUser.value = updated
      localStorage.setItem('currentUser', JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to enrich user with role', e)
    }
  } else {
    currentUser.value = null
    localStorage.removeItem('currentUser')
    isAuthenticated.value = false
  }
})

// --- API: login / logout ---
export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    return true
  } catch (e) {
    console.error('Firebase login failed', e)
    return e?.code || false
  }
}

export async function logout() {
  await signOut(auth)
}
