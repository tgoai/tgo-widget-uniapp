<script setup lang="ts">
import { useChatStore } from '@/store/chat'

const chatStore = useChatStore()
const msg = ref('')

async function onSend() {
  if (msg.value.trim() === '')
    return
  if (chatStore.isStreaming && !chatStore.streamCanceling) {
    try { await chatStore.cancelStreaming('auto_cancel_on_new_send') }
    catch {}
  }
  chatStore.sendMessage(msg.value)
  msg.value = ''
}

const keyboardHeight = ref(0)

function onKeyboardheightchange(e: any) {
  keyboardHeight.value = e.detail.height
}

const style = computed(() => {
  const flag = keyboardHeight.value > 0
  const height = flag
    ? `calc(5rpx + ${keyboardHeight.value}px)`
    : `calc(10rpx + env(safe-area-inset-bottom))`
  return `padding-bottom: ${height}; `
})

const isSend = ref(false)

watch(
  () => chatStore.isStreaming,
  (newVal) => {
    console.log(newVal)
    if (newVal)
      isSend.value = true
    else
      isSend.value = false
  },
  { deep: true },
)
function onCancelSend() {
  if (!chatStore.streamCanceling) {
    void chatStore.cancelStreaming('user_click')
  }
}
</script>

<template>
  <view class="message-input p-2" :style="style">
    <view class="flex rounded-20rpx bg-[#fff] p-2">
      <input
        v-model="msg"
        placeholder="发送消息..."
        type="text"
        autocomplete="off"
        :disabled="isSend"
        confirm-type="send"
        class="mr-2 h-64rpx flex-1"
        :adjust-position="false"
        :show-confirm-bar="false"
        @confirm="onSend"
        @keyboardheightchange="onKeyboardheightchange"
      >
      <wd-button v-if="!isSend" custom-class="!min-w-auto !px-[14rpx]" @click="onSend">
        <wd-icon name="arrow-up1" :size="22"></wd-icon>
      </wd-button>
      <wd-button v-else custom-class="!min-w-auto !px-[14rpx]" @click="onCancelSend">
        <wd-icon name="stop-circle" :size="22"></wd-icon>
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss">
  .message-input {
    padding-bottom: env(safe-area-inset-bottom);
  }
</style>
