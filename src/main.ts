import { createSSRApp } from 'vue'
import App from '@/App.vue'

import router from '@/router'

import store from '@/store'
import TgoWidget from '@/TgoWidget'
import 'uno.css'

export function createApp() {
  const app = createSSRApp(App)
  app.use(router)
  app.use(store)
  const tgoWidget = new TgoWidget()
  tgoWidget.init({ apiKey: __API_KEY__, apiBase: __API_BASE__ })
  app.config.globalProperties.$tgoWidget = tgoWidget

  return {
    app,
  }
}
