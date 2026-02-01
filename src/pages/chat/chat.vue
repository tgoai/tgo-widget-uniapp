<script setup lang="ts">
import { isH5 } from '@uni-helper/uni-env'
import Bubble from '@/components/Bubble.vue'

import Sender from '@/components/Sender.vue'
import { recordVisitorActivity } from '@/services/visitorActivity'
import { useChatStore } from '@/store/chat'
import { usePlatformStore } from '@/store/platform'

const { value: apiKey } = useQuery('apiKey')
const { value: apiBase } = useQuery('apiBase')

definePage(() => {
  if (!isH5) {
    return {
      style: {
        navigationBarTitleText: 'Tgo AI 客服',
        enablePullDownRefresh: true,
      },
    }
  }
  return {
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
      console.log('[Chat] New message received, scrolling to bottom')
    }
  },
  {
    deep: true,
    immediate: true,
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

const sessionStarted = ref(false)
const sessionStartAt = ref(0)
const pagesVisited = ref(0)
const sessionEndSent = ref(false)

const SS_STARTED_AT = 'tgo_session_started_at'
const SS_PAGES = 'tgo_session_pages'

try {
  const s = uni.getStorageSync(SS_STARTED_AT)
  if (s) {
    sessionStarted.value = true
    sessionStartAt.value = Number.parseInt(s, 10) || 0
    const pv = Number.parseInt(uni.getStorageSync(SS_PAGES) || '0', 10)
    pagesVisited.value = isNaN(pv) ? 0 : pv
  }
}
catch {}

function markSessionStarted() {
  sessionStarted.value = true
  sessionStartAt.value = Date.now()
  pagesVisited.value = 0
  sessionEndSent.value = false
  uni.setStorageSync(SS_STARTED_AT, String(sessionStartAt.value))
  uni.setStorageSync(SS_PAGES, '0')
}

function incPagesVisited() {
  pagesVisited.value += 1
  uni.setStorageSync(SS_PAGES, String(pagesVisited.value))
}

async function sendSessionStart() {
  const currentUrl = '/pages/index'
  const currentReferrer = '/pages/index'
  // 获取用户ID

  const uid = chatStore.myUid
  if (!platformStore._apiBase || !platformStore._platformApiKey || !uid)
    return
  let visitorId = ''
  if (uid && uid.endsWith('-vtr')) {
    visitorId = uid.substring(0, uid.length - 4)
  }
  else {
    visitorId = uid
  }
  markSessionStarted()

  void recordVisitorActivity({
    apiBase: platformStore._apiBase as string,
    visitorId,
    activityType: 'session_start',
    title: 'Session started',
    context: { page_url: currentUrl, referrer: currentReferrer || '' },
  }).catch(err => console.warn('[Activity] Failed to record session_start', err))
  incPagesVisited()
}

function sendSessionEnd(source?: string) {
  if (sessionEndSent.value || !sessionStarted.value) {
    console.warn('[Activity] sendSessionEnd skipped: already sent or session not started', { sessionEndSent: sessionEndSent.value, sessionStarted: sessionStarted.value, source })
    return
  }

  sessionEndSent.value = true

  const currentUrl = '/pages/index'
  const currentReferrer = '/pages/index'
  const uid = chatStore.myUid
  const apiBase = platformStore._apiBase
  if (!apiBase || !platformStore._platformApiKey || !uid)
    return
  let visitorId = ''
  if (uid && uid.endsWith('-vtr')) {
    visitorId = uid.substring(0, uid.length - 4)
  }
  else {
    visitorId = uid
  }

  const now = Date.now()
  const total = sessionStartAt.value ? Math.max(0, Math.round((now - sessionStartAt.value) / 1000)) : null

  void recordVisitorActivity({
    apiBase,
    visitorId,
    activityType: 'session_end',
    title: 'Session ended',
    durationSeconds: total ?? undefined,
    context: { page_url: currentUrl, referrer: currentReferrer || '', metadata: { pages_visited: pagesVisited } },
    keepalive: true,
  }).catch(err => console.warn('[Activity] Failed to record session_end', err))
}

// 页面加载时初始化IM
onMounted(async () => {
  if (!apiKey.value && !apiBase.value) {
    console.log('[TGO] apiKey or apiBase is empty')
  }
  // await platformStore.init(apiBase.value || __API_BASE__, apiKey.value || __API_KEY__)
  // await initIM({ apiBase: apiBase.value || __API_BASE__ })

  await sendSessionStart()
})

onBeforeUnmount(() => {
  sendSessionEnd('flush_exit')
  console.log('[TGO] App is closing')
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
