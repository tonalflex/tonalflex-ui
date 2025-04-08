import './assets/main.css'
import { createApp } from 'vue'
import { MockBackend } from '@tonalflex/template-plugin'
import type { IAudioBackend } from '@tonalflex/template-plugin'

import App from './App.vue'

const app = createApp(App)
const backend: IAudioBackend = new MockBackend()
app.provide('audio-backend', backend)
app.mount('#app')
