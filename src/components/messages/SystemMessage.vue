<script setup lang="ts">
import type { SystemMessageExtra } from '@/types/chat'
import { useI18n } from 'vue-i18n'
import { formatSystemMessageContent } from '@/types/chat'

const props = defineProps<SystemMessageProps>()

const { t } = useI18n()

interface SystemMessageProps {
  type: number
  content: string
  extra?: SystemMessageExtra[]
}
const formattedContent = computed(() => {
  const params: Record<string, string> = {}
  if (props.extra && Array.isArray(props.extra)) {
    props.extra.forEach((item, index) => {
      params[`name${index}`] = item?.name || item?.uid || ''
    })
  }
  switch (props.type) {
    case 1000: // SYSTEM_STAFF_ASSIGNED
      return t('system.staffAssigned', { ...params, defaultValue: formatSystemMessageContent(props.content, props.extra) })
    case 1001: // SYSTEM_SESSION_CLOSED
      if (!props.extra || props.extra.length === 0) {
        return t('system.sessionClosedNoAgent', { defaultValue: 'Session ended.' })
      }
      return t('system.sessionClosed', { ...params, defaultValue: formatSystemMessageContent(props.content, props.extra) })
    case 1002: // SESSION_TRANSFERRED
      return t('system.sessionTransferred', { ...params, defaultValue: formatSystemMessageContent(props.content, props.extra) })
    default:
      return formatSystemMessageContent(props.content, props.extra)
  }
})
</script>

<template>
  <view class="system-message">
    <text class="message-content">
      {{ formattedContent }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
  .system-message {
    display: flex;
    align-items: center;
    justify-content: center;
    .message-content {
      padding: 14rpx 20rpx;
      color: #666;
      text-align: center;
      background-color: #f0f0f0;
      border-radius: 999px;
      font-size: 26rpx;
    }
  }
</style>
