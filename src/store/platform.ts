import type { PlatformConfig } from '@/services/platform'

import { defineStore } from 'pinia'
import { fetchPlatformInfo } from '@/services/platform'
import { getJSON, setJSON } from '@/utils/storage'

const defaultConfig: PlatformConfig = {
  position: 'bottom-right',
  theme_color: '#2f80ed',
  widget_title: 'Tgo',
  welcome_message: undefined,
  logo_url: undefined,
}

const WELCOME_KEY = (apiBase: string, platformApiKey: string) => `tgo:welcome-shown:${apiBase}:${platformApiKey}`
const EXPANDED_KEY = (apiBase: string, platformApiKey: string) => `tgo:expanded:${apiBase}:${platformApiKey}`

export const usePlatformStore = defineStore('platform', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const config = ref<PlatformConfig>(defaultConfig)

  const isExpanded = ref(false)
  const isVisible = ref(false)
  const welcomeInjected = ref(false)

  const _apiBase = ref<string | undefined>(undefined)
  const _platformApiKey = ref<string | undefined>(undefined)

  function setConfig(newConfig: PlatformConfig) {
    config.value = { ...config.value, ...newConfig }
  }

  function setExpanded(v: boolean) {
    isExpanded.value = !!v
    const apiBase = _apiBase.value
    const platformApiKey = _platformApiKey.value
    if (apiBase && platformApiKey)
      setJSON(EXPANDED_KEY(apiBase, platformApiKey), !!v)
  }

  function toggleExpanded() {
    setExpanded(!isExpanded.value)
  }

  function markWelcomeInjected() {
    welcomeInjected.value = true
    const apiBase = _apiBase.value
    const platformApiKey = _platformApiKey.value
    if (apiBase && platformApiKey)
      setJSON(WELCOME_KEY(apiBase, platformApiKey), true)
  }

  async function init(apiBase: string, platformApiKey: string) {
    if (!apiBase || !platformApiKey)
      return
    if (loading.value)
      return
    loading.value = true
    _apiBase.value = apiBase
    _platformApiKey.value = platformApiKey
    try {
      // read welcomeInjected & expanded from storage first
      try {
        const injected = !!getJSON<boolean>(WELCOME_KEY(apiBase, platformApiKey))
        if (injected)
          welcomeInjected.value = true

        const expanded = getJSON<boolean>(EXPANDED_KEY(apiBase, platformApiKey))
        if (typeof expanded === 'boolean') {
          isExpanded.value = expanded
        }
      }
      catch (e) {
        console.error('[Platform] init welcomeInjected failed', e)
      }

      const info = await fetchPlatformInfo({ apiBase, platformApiKey })
      config.value = { ...config.value, ...info.config }
      console.log('[Platform] Loaded config:', config.value)

      // Apply display_mode: if set, use it as default (unless user has explicitly toggled before)
      const cachedExpandedRaw = getJSON(EXPANDED_KEY(apiBase, platformApiKey))
      const hasUserToggled = cachedExpandedRaw !== null
      console.log('[Platform] display_mode:', config.value.display_mode, 'cachedExpandedRaw:', cachedExpandedRaw, 'hasUserToggled:', hasUserToggled)
      if (config.value.display_mode === 'small' && !hasUserToggled) {
        isExpanded.value = false
      }
      else if (config.value.display_mode === 'big' && !hasUserToggled) {
        isExpanded.value = true
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    config,
    error,
    isExpanded,
    isVisible,
    welcomeInjected,
    _apiBase,
    _platformApiKey,
    setConfig,
    setExpanded,
    toggleExpanded,
    markWelcomeInjected,
    init,
  }
})
