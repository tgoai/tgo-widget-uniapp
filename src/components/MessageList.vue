<script setup lang="ts">
import type { ChatMessage } from '@/types/chat'

import Bubble from './Bubble.vue'

const props = defineProps({
  messages: {
    type: Array as PropType<ChatMessage[]>,
    default: () => [],
  },
})

const data = reactive({
  scrollId: '',
})

watch(
  () => props.messages,
  (newMessages) => {
    if (newMessages.length > 0) {
      setScrollbarPosition()
    }
  },
  { deep: true },
)

function setScrollbarPosition() {
  data.scrollId = ''
  nextTick(async () => {
    data.scrollId = 'last-scrollItem'
  })
}
</script>

<template>
  <scroll-view class="chat__body" scroll-y :scroll-into-view="data.scrollId" enable-flex>
    <view class="p-2">
      <template v-for="item in messages" :key="item.id">
        <Bubble :item="item" />
      </template>
    </view>

    <view id="last-scrollItem" style="padding-bottom: 1px;"></view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.chat__body {
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
</style>
