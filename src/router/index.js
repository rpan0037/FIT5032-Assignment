// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from "../auth";


const Home = () => import('../pages/HomePage.vue')
const Resources = () => import('../pages/ResourcesPage.vue')
const Events = () => import('../pages/EventsPage.vue')
const Help = () => import('../pages/HelpPage.vue')
const About = () => import('../pages/AboutPage.vue')
const Contact = () => import('../pages/ContactPage.vue')
const Login = () => import('../pages/LoginPage.vue')
const Register = () => import('../pages/RegisterPage.vue')
const Admin = () => import('../pages/AdminPage.vue')

const router = createRouter({
  history: createWebHistory(),
  linkActiveClass: 'active',
  linkExactActiveClass: 'active',
  routes: [
    { path: '/', component: Home, name: 'Home', meta: {requiresAuth: true} },
    { path: '/resources', component: Resources, name: 'Resources', meta: {requiresAuth: true} },
    { path: '/events', component: Events, name: 'Events', meta: {requiresAuth: true} },
    { path: '/help', component: Help, name: 'Help', meta: {requiresAuth: true} },
    { path: '/about', component: About, name: 'About', meta: {requiresAuth: true} },
    { path: '/contact', component: Contact, name: 'Contact', meta: {requiresAuth: true} },
    { path: '/admin', component: Admin, name: 'Admin', meta: { requiresAuth: true } },
    {path: '/login', component: Login, name: 'Login'},
    { path: '/register', component: Register, name: 'Register', meta: { requiresAuth: false } }
  ],
  scrollBehavior: () => ({ top: 0 }) // ensures scroll to top on navigation
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
