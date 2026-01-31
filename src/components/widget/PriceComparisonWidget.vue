<script setup lang="ts">
import type { PriceComparisonWidgetData } from './types'
import ActionButtons from './ActionButtons.vue'

defineOptions({
  options: {
    styleIsolation: 'shared',
  },
})

const props = defineProps<{ data: PriceComparisonWidgetData }>()
</script>

<template>
  <wd-card custom-class="price-comparison-widget">
    <!-- 标题 -->
    <view class="title">
      {{ data.title }}
    </view>

    <!-- 价格比较表格 -->
    <wd-table :data="data.items">
      <wd-table-column v-for="column in data.columns" :key="column" :label="column">
        <template #default="{ row }">
          {{ row[column] }}
        </template>
      </wd-table-column>
    </wd-table>

    <!-- 推荐原因 -->
    <view v-if="data.recommendation_reason" class="recommendation-reason">
      {{ data.recommendation_reason }}
    </view>

    <!-- 操作 -->
    <view v-if="data.actions" class="actions">
      <ActionButtons :actions="data.actions" />
    </view>
  </wd-card>
</template>

<style lang="scss">
  .price-comparison-widget {
    @apply !mx-0 !bg-#f5f5f5 !py-3;
    .title {
      @apply text-[32rpx] font-bold flex items-center mb-[10rpx];
    }

    .recommendation-reason{
      @apply text-[#16a34a] text-[28rpx] font-medium flex items-start mb-[10rpx];
    }

    .actions {
      @apply flex items-center justify-end;
    }
  }
</style>
