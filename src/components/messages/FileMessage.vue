<script setup lang="ts">
import { formatFileSize } from './messageUtils'

interface FileMessageProps {
  url: string
  name: string
  size: number
}

defineProps<FileMessageProps>()
</script>

<template>
  <view class="file-message">
    <view class="file-message-icon">
      <view class="i-carbon:ibm-cloud-vpc-file-storage text-[46rpx]"></view>
    </view>
    <view class="file-message-info">
      <view class="file-message-info-title">
        {{ name }}
      </view>
      <view class="file-message-info-size">
        {{ formatFileSize(size) }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.file-message {
  display: flex;
  width: 600rpx;
}

.file-message-icon{
  display: flex;
  justify-content: center;
  align-items: center;
  width: 120rpx;
  height: 120rpx;
  margin-right: 16rpx;
}

.file-message-info{
  flex: 1;
}

.file-message-info-title{
  font-size: 32rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.file-message-info-size{
  font-size: 28rpx;
  color: #999;
}
</style>
