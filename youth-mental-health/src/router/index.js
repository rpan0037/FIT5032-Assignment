// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const Home = () => import('../pages/HomePage.vue')
const Resources = () => import('../pages/ResourcesPage.vue')
const Events = () => import('../pages/EventsPage.vue')
const Help = () => import('../pages/HelpPage.vue')
const About = () => import('../pages/AboutPage.vue')
const Contact = () => import('../pages/ContactPage.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/resources', component: Resources },
    { path: '/events', component: Events },
    { path: '/help', component: Help },
    { path: '/about', component: About },
    { path: '/contact', component: Contact }
  ],
  scrollBehavior: () => ({ top: 0 }) // ensures scroll to top on navigation
})

export default router
