<script setup lang="ts">
import type { SystemMessageExtra } from '@/types/chat'
import { formatSystemMessageContent } from '@/types/chat'

interface SystemMessageProps {
  type: number
  content: string
  extra?: SystemMessageExtra[]
}
const props = defineProps<SystemMessageProps>()

const formattedContent = computed(() => {
  const params: Record<string, string> = {}
  if (props.extra && Array.isArray(props.extra)) {
    props.extra.forEach((item, index) => {
      params[`name${index}`] = item?.name || item?.uid || ''
    })
  }
  switch (props.type) {
    case 1000: // SYSTEM_STAFF_ASSIGNED
      return formatSystemMessageContent(props.content, props.extra)
    case 1001: // SYSTEM_SESSION_CLOSED
      return formatSystemMessageContent(props.content, props.extra)
    case 1002: // SESSION_TRANSFERRED
      return formatSystemMessageContent(props.content, props.extra)
    default:
      return formatSystemMessageContent(props.content, props.extra)
  }
})
</script>

<template>
  <view class="system-message">
    <view class="message-content">
      {{ formattedContent }}
    </view>
  </view>
</template>

<style lang="scss" scoped>
  .system-message {
    display: flex;
    align-items: center;
    justify-content: center;
    .message-content {
      padding: 10rpx;
      color: #333;
      font-style: italic;
      text-align: center;
    }
  }
</style>
