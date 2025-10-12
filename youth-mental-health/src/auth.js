import { ref } from 'vue'
import usersData from './assets/json/login_credentials.json'

export const currentUser = ref(JSON.parse(localStorage.getItem('currentUser')) || null)

export const isAuthenticated = ref(currentUser.value !== null)

export function login(username, password) {
  const user = usersData.find(
    u => u.email.toLowerCase() === username.toLowerCase() && u.password === password
  )
  if (user) {
    currentUser.value = { id: user.id, name: user.name, email: user.email, role: user.role }
    localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    isAuthenticated.value = true
    return true
  }
  return false
}

export function logout() {
  currentUser.value = null
  localStorage.removeItem('currentUser')
  isAuthenticated.value = false
}
