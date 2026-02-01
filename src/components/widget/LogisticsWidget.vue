<script setup lang="ts">
import type { LogisticsWidgetData } from './types'
import ActionButtons from './ActionButtons.vue'

defineOptions({
  options: {
    styleIsolation: 'shared',
  },
})

const props = defineProps<{ data: LogisticsWidgetData }>()
</script>

<template>
  <wd-card type="rectangle" custom-class="logistics-widget">
    <template #title>
      <view class="title">
        <view class="flex items-center">
          <view class="i-carbon:delivery-truck text-[38rpx] text-[#9333ea]"></view>
          <view class="title-text">
            {{ data.carrier }}
          </view>
        </view>
        <view class="title-tracking-number">
          {{ data.tracking_number }}
        </view>
      </view>
    </template>
    <!-- Logistics Widget Content -->
    <view class="logistics-widget-content">
      <!-- 预计送达 -->
      <view v-if="data.estimated_delivery" class="estimated-delivery">
        <view class="i-carbon:time text-[38rpx]"></view>
        <view>
          预计送达: {{ data.estimated_delivery }}
        </view>
      </view>
      <!-- 配送员信息 -->
      <view v-if="data.courier_name" class="courier-info">
        <view>
          配送员: {{ data.courier_name }}
        </view>
        <view v-if="data.courier_phone" class="flex items-center">
          <view class="i-carbon:phone text-[38rpx]"></view>
          {{ data.courier_phone }}
        </view>
      </view>
      <!-- 时间线  -->
      <wd-steps :active="1" vertical>
        <wd-step
          v-for="(step, index) in data.timeline"
          :key="index"
          :title="step.description"
          :content="step.time"
        />
      </wd-steps>
      <!-- 操作按钮 -->
      <view v-if="data.actions" class="mt-[10rpx] flex justify-end">
        <ActionButtons :actions="data.actions" />
      </view>
    </view>
  </wd-card>
</template>

<style>
.logistics-widget {
  @apply !mx-0 !bg-#f5f5f5;
}

.logistics-widget .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

.logistics-widget .logistics-widget-content{

}

.logistics-widget .logistics-widget-content .estimated-delivery {
  @apply text-[#16a34a] text-[28rpx] flex items-center gap-[10rpx] p-[10rpx] mb-[10rpx];
}

.logistics-widget .logistics-widget-content .courier-info {
  @apply text-[28rpx] flex items-center gap-[10rpx] p-[10rpx] mb-[10rpx];
}
</style>
