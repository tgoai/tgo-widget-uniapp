<script setup lang="ts">
import { isH5 } from '@uni-helper/uni-env'
import Bubble from '@/components/Bubble.vue'

import Sender from '@/components/Sender.vue'
import { useChatStore } from '@/store/chat'
import { usePlatformStore } from '@/store/platform'

const { value: apiKey } = useQuery('apiKey')
const { value: apiBase } = useQuery('apiBase')

definePage(() => {
  if (!isH5) {
    return {
      type: 'home',
      style: {
        navigationBarTitleText: 'Tgo AI 客服',
        enablePullDownRefresh: true,
      },
    }
  }
  return {
    type: 'home',
    style: {
      navigationBarTitleText: 'Tgo AI 客服',
      navigationStyle: 'custom',
    },
  }
})
const { initIM } = useChatStore()
const chatStore = useChatStore()
const platformStore = usePlatformStore()

const messages = computed(() => chatStore.messages)

const data = reactive({
  scrollId: '',
})

// 监听messages变化，滚动到最后一条消息
watch(
  () => messages.value,
  (newMessages) => {
    if (newMessages.length > 0) {
      setScrollbarPosition()
    }
  },
  {
    deep: true,
  },
)

function setScrollbarPosition() {
  data.scrollId = ''
  nextTick(async () => {
    if (refresherTriggered.value) {
      return data.scrollId = ''
    }
    data.scrollId = 'last-scrollItem'
  })
}

watch(
  () => [platformStore.config.welcome_message, platformStore.welcomeInjected],
  () => {
    const welcome = platformStore.config.welcome_message
    if (welcome && !platformStore.welcomeInjected) {
      chatStore.ensureWelcomeMessage(welcome)
      platformStore.markWelcomeInjected()
    }
  },
  { deep: true },
)

// 刷新事件处理函数
const refresherTriggered = ref(false)
async function onRefresh() {
  refresherTriggered.value = true
  await chatStore.loadMoreHistory()
  refresherTriggered.value = false
}

// 页面加载时初始化IM
onMounted(async () => {
  if (!apiKey.value && !apiBase.value) {
    console.log('[TGO] apiKey or apiBase is empty')
  }
  await platformStore.init(apiBase.value || __API_BASE__, apiKey.value || __API_KEY__)
  initIM({ apiBase: apiBase.value || __API_BASE__ })
})
</script>

<template>
  <view class="page h-full flex flex-col bg-[#f5f5f5]">
    <scroll-view
      class="chat__body"
      scroll-y
      :scroll-into-view="data.scrollId"
      :refresher-enabled="true"
      :refresher-triggered="refresherTriggered"
      enable-flex
      @refresherrefresh="onRefresh"
    >
      <view class="p-2">
        <template v-for="item in messages" :key="item.id">
          <Bubble :item="item" />
        </template>
      </view>

      <view id="last-scrollItem" style="padding-bottom: 1px;"></view>
    </scroll-view>
    <Sender />
  </view>
</template>

<style lang="scss" scoped>
// #ifdef H5
uni-page-body, .page {
  height: 100%;
}
// #endif

// #ifdef MP-WEIXIN
.page {
  height: 100vh;
}
// #endif

.page {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.chat__body {
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
</style>
