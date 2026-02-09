<script setup lang="ts">
import type { PropType } from 'vue'
import type {
  ChatMessage,
  FileMessagePayload,
  ImageMessagePayload,
  SystemMessagePayload,
  TextMessagePayload,
} from '@/types/chat'

import { isSystemMessageType } from '@/types/chat'
import { formatMessageTime } from '@/utils/time'

import ChatLoading from './ChatLoading.vue'
// @ts-ignore
import Markdown from './Markdown.vue'
import FileMessage from './messages/FileMessage.vue'
import SystemMessage from './messages/SystemMessage.vue'

const props = defineProps({
  item: {
    type: Object as PropType<ChatMessage>,
    default: () => {},
  },
})

// 是否系统消息
const isSystemMessage = computed(() => {
  return isSystemMessageType(props.item.payload.type)
})
</script>

<template>
  <SystemMessage
    v-if="isSystemMessage"
    :type="item.payload.type"
    :content="(item.payload as SystemMessagePayload)?.content"
    :extra="(item.payload as SystemMessagePayload)?.extra"
  />
  <view v-else class="message-item" :class="{ 'is-self': item.role === 'user', 'is-agent': item.role === 'agent' }">
    <view class="message-item-content">
      <view class="message-item-box">
        <!-- Type 2: 图片消息 -->
        <view v-if="item.payload.type === 2">
          <image :src="(item.payload as ImageMessagePayload)?.url" style="max-height: 200rpx; max-width: 200rpx;" />
        </view>
        <!--  Type 3: 文件消息 -->
        <FileMessage
          v-else-if="item.payload.type === 3"
          :url="(item.payload as FileMessagePayload)?.url"
          :name="(item.payload as FileMessagePayload)?.name"
          :size="(item.payload as FileMessagePayload)?.size"
        />
        <!-- 流式消息 -->
        <Markdown v-else-if="item.streamData && item.streamData.length" :source="item.streamData" />
        <!-- 错误消息 -->
        <view v-else-if="item.payload.type === 4" class="flex items-center gap-2 text-red-500">
          {{ item.errorMessage }}
        </view>
        <!-- Type 100: AI 加载状态 -->
        <view v-else-if="item.payload.type === 100">
          <ChatLoading v-if="!item.streamData" />
        </view>
        <!-- 默认 / Type 1: 普通文本消息 -->
        <template v-else>
          <view v-if="item.payload.type === 1">
            <Markdown :source="(item.payload as TextMessagePayload)?.content" />
          </view>
          <view v-else>
            [消息]
          </view>
        </template>
      </view>
      <view class="message-item-time">
        {{ formatMessageTime(item.time) }}
      </view>
    </view>
  </view>
</template>

<style lang="scss">
  .message-item {
    margin-bottom: 16rpx;
    display: flex;
    align-items: flex-start;
    &-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      overflow-x: hidden;
    }
    &-box {
      border-radius: 20rpx;
      padding: 16rpx;
      background-color: #fff;
      font-size: 24rpx;
      max-width: 100%;
      box-sizing: border-box;
    }
    &-time {
      font-size: 24rpx;
      color: #999;
      margin-top: 8rpx;
    }

    &.is-agent {
      &::after {
        content: " ";
        flex: 1;
        min-width: 12px;
      }
    }

    &.is-self {
      &::before {
        content: " ";
        flex: 1;
        min-width: 12px;
      }
      .message-item-content {
        align-items: flex-end;
      }
      .message-item-box {
        background-color: #007AFF;
        color: #fff;
      }
      .message-item-time {
        text-align: right;
      }
    }
  }
</style>
