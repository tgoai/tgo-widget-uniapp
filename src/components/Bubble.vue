<script setup lang="ts">
import type { ChatMessage, SystemMessagePayload } from '@/types/chat'

import { formatSystemMessageContent, isSystemMessageType } from '@/types/chat'
import { formatMessageTime } from '@/utils/time'

import ChatLoading from './ChatLoading.vue'
// @ts-ignore
import Markdown from './Markdown.vue'

defineProps({
  item: {
    type: Object as PropType<ChatMessage>,
    default: () => {},
  },
})
</script>

<template>
  <view class="message-item" :class="{ 'is-self': item.role === 'user', 'is-agent': item.role === 'agent' }">
    <view class="message-item-content">
      <view class="message-item-box">
        <view v-if="item.payload.type === 1">
          <Markdown :source="item.payload?.content" />
        </view>
        <view v-if="item.payload.type === 2">
          <image :src="item.payload?.url" style="max-height: 200rpx; max-width: 200rpx;" />
        </view>
        <view v-else-if="item.payload.type === 100">
          <ChatLoading v-if="!item.streamData" />
          <view v-else>
            <Markdown :source="item.streamData" />
          </view>
        </view>
        <view v-else-if="isSystemMessageType(item.payload.type)">
          {{ formatSystemMessageContent((item.payload as SystemMessagePayload)?.content, (item.payload as SystemMessagePayload)?.extra) }}
        </view>
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
