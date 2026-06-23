// Entry point aplikasi: pasang Pinia, Router, dan mount.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Bootstrap auth (pasang bridge ke http + pulihkan role) SEBELUM router aktif,
// agar guard pertama sudah punya akses token.
useAuthStore().bootstrap()

app.use(router)
app.mount('#app')
