import { usePlatformStore } from '@/store/platform'

export function resolveApiKey(): string | undefined {
  const { _platformApiKey } = usePlatformStore()
  return _platformApiKey
}

export function requireApiKeyOrThrow(): string {
  const v = resolveApiKey()
  if (!v) {
    throw new Error('[Visitor] Missing apiKey in URL (?apiKey=...). Ensure the SDK injects it into the control iframe URL via history.replaceState.')
  }
  return v
}

export type ThemeMode = 'light' | 'dark'
