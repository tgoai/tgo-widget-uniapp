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

const isShowMore = ref(false)
// 选择照片
function onPhoto() {
  uni.chooseImage({
    count: 1,
    success: (res: any) => {
      console.log('[Sender] chooseImage success:', res)
      chatStore.uploadUinFiles(res.tempFilePaths as string[], true)
    },
  })
}
// 选择视频
function onVideo() {
  uni.chooseVideo({
    count: 1,
    success: (res: any) => {
      console.log('[Sender] chooseVideo success:', res)
      chatStore.uploadUinFiles([res.tempFilePath], false)
    },
  })
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
        <view class="i-carbon:send-alt-filled text-[38rpx]"></view>
      </wd-button>
      <wd-button v-else custom-class="!min-w-auto !px-[14rpx]" @click="onCancelSend">
        <view class="i-carbon:stop-filled text-[38rpx]"></view>
      </wd-button>
    </view>
    <view v-if="isShowMore" class="box-border h-300rpx flex gap-8 py-3">
      <view class="flex flex-col items-center" @click="onPhoto">
        <view class="h-120rpx w-120rpx flex items-center justify-center rounded-20rpx bg-[#fff]">
          <wd-icon name="image" :size="26"></wd-icon>
        </view>
        <text class="mt-2 text-[24rpx] text-[#666]">
          照片
        </text>
      </view>
      <view class="flex flex-col items-center" @click="onVideo">
        <view class="h-120rpx w-120rpx flex items-center justify-center rounded-20rpx bg-[#fff]">
          <wd-icon name="photo" :size="26"></wd-icon>
        </view>
        <text class="mt-2 text-[24rpx] text-[#666]">
          视频
        </text>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
  .message-input {
    padding-bottom: env(safe-area-inset-bottom);
  }
</style>
