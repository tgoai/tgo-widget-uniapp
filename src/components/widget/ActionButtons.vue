<script setup lang="ts">
import type { WidgetAction } from './types'
import type { ActionHandlerConfig } from '@/utils/actionUri'
import { executeAction, parseActionURI } from '@/utils/actionUri'

const props = defineProps<{
  actions: WidgetAction[]
}>()

const emits = defineEmits<{
  /** 发送消息回调（用于 msg:// 协议） */
  (e: 'sendMessage', message: string): void
  /** 通用 action 回调（用于非标准 URI 或向后兼容） */
  (e: 'action', action: string, payload?: Record<string, unknown>): void
  (e: 'copySuccess', text: string): void
}>()

/**
 * 处理 action 点击事件
 * @param action
 */
async function onAction(action: WidgetAction) {
  const parsed = parseActionURI(action.action)

  if (parsed.isValid) {
    // 处理有效的动作 URI
    const config: ActionHandlerConfig = {
      onSendMessage: (message: string) => {
        emits('sendMessage', message)
      },
      onCopySuccess: (text: string) => {
        emits('copySuccess', text)
      },
      onUnknownProtocol: () => {
        // 如果协议未知，回退到通用 action 回调
        emits('action', action.action, action.payload)
      },
    }

    const result = await executeAction(action.action, config)

    if (!result.success && parsed.protocol !== 'url') {
      console.warn('[ActionButtons] Action failed:', result.error)
    }
  }
  else if (action.url) {
    // 处理 URL 动作
    // 打开指定的 URL
    try {
      // 在 uni-app 环境中使用 uni API 打开链接
      if (typeof uni !== 'undefined' && 'openURL' in uni) {
        (uni as any).openURL({
          url: action.url,
          fail: (error: any) => {
            console.error('Failed to open URL with uni.openURL:', error)
            // 如果 uni.openURL 失败，尝试使用 window.open（用于 H5 端）
            try {
              const newWindow = window.open(action.url, '_blank', 'noopener,noreferrer')
              if (!newWindow) {
                console.warn('Popup may have been blocked')
              }
            }
            catch (windowError: any) {
              console.error('Failed to open URL with window.open:', windowError)
            }
          },
        })
      }
      else {
        // 在非 uni-app 环境（如 H5）中使用 window.open
        const newWindow = window.open(action.url, '_blank', 'noopener,noreferrer')
        if (!newWindow) {
          console.warn('Popup may have been blocked')
        }
      }
    }
    catch (error: any) {
      console.error('Failed to open URL:', error)
    }
  }
  else {
    // 对于无效的 URI 或其他情况，发出通用 action 事件
    emits('action', action.action, action.payload)
  }
}
</script>

<template>
  <view class="action-buttons">
    <wd-button v-for="(action, index) in actions" :key="index" @click="onAction(action)">
      {{ action.label }}
    </wd-button>
  </view>
</template>

<style lang="scss" scoped>
</style>
