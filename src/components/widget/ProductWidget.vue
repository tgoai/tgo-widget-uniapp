<script setup lang="ts">
import type { ProductWidgetData } from './types'

import ActionButtons from './ActionButtons.vue'
import { formatPrice } from './shared'

defineOptions({
  options: {
    styleIsolation: 'shared',
  },
})

const props = defineProps<{ data: ProductWidgetData }>()

const currency = computed(() => props.data.currency || '¥')
const hasDiscount = computed(() => props.data.price && props.data.original_price && props.data.price < props.data.original_price)
</script>

<template>
  <wd-card custom-class="product-widget">
    <!-- 标题 -->
    <view v-if="data.title" class="title">
      {{ data.title }}
    </view>

    <!-- 图片 -->
    <view v-if="data.thumbnail" class="image">
      <wd-img :src="data.thumbnail?.url" :alt="data.thumbnail?.alt" />
    </view>

    <!-- 标签 -->
    <view v-if="data.tags && data.tags.length > 0" class="tags">
      <wd-tag v-for="tag in data.tags.slice(0, 3)" :key="tag" custom-class="tag">
        {{ tag }}
      </wd-tag>
    </view>
    <!-- 名称 -->
    <view v-if="data.name" class="name">
      {{ data.name }}
    </view>
    <!-- 品牌 -->
    <view v-if="data.brand" class="brand">
      {{ data.brand }}
    </view>
    <!-- 描述 -->
    <view v-if="data.description" class="description">
      {{ data.description }}
    </view>

    <!-- 价格 -->
    <view v-if="data.price" class="price flex">
      <view class="price-text">
        {{ formatPrice(data.price, currency) }}
      </view>
      <view v-if="hasDiscount" class="price-text">
        {{ formatPrice(data?.original_price, currency) }}
      </view>
    </view>

    <!-- 评分 -->
    <view v-if="data.rating || data.review_count" class="rating flex items-center">
      <wd-rate v-if="data.rating" :value="data.rating" :count="5" readonly />
      <view v-if="data.review_count" class="review-count">
        {{ data.review_count }} 条评价
      </view>
    </view>

    <!-- 库存状态 -->
    <view v-if="data.stock_status" class="stock-status">
      {{ data.in_stock !== false ? (data.stock_status || '有货') : '暂时缺货' }}
    </view>

    <!-- 规格 -->
    <view v-if="data.specs && data.specs.length > 0" class="specs">
      <view v-for="spec in data.specs" :key="spec.name" class="spec-item">
        <view class="spec-name">
          {{ spec.name }}：
        </view>
        <view class="spec-value">
          {{ spec.value }}
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view v-if="data.actions && data.actions.length > 0" class="actions">
      <ActionButtons :actions="data.actions" />
    </view>
  </wd-card>
</template>

<style>
  .product-widget {
  @apply !mx-0 !bg-#f5f5f5 !py-3;
}
.product-widget .title {
  @apply text-[32rpx] font-bold flex items-center mb-[10rpx];
}
.product-widget .image {
  @apply w-full h-[200rpx] object-cover rounded-[10rpx] mb-[10rpx];
}
.product-widget .tags {
  @apply flex items-center flex-wrap mb-[10rpx];
}
.product-widget .name {
  @apply text-[#333] text-[28rpx] font-medium flex items-start mb-[10rpx];
}
.product-widget .brand {
  @apply text-[#333] text-[28rpx] font-medium flex items-start mb-[10rpx];
}
.product-widget .description {
  @apply text-[#333] text-[28rpx] font-medium flex items-start mb-[10rpx];
}
.product-widget .specs {
  @apply flex items-start flex-wrap mb-[10rpx];
}
.product-widget .specs .spec-item {
  @apply flex items-center;
}
.product-widget .specs .spec-item .spec-name {
  @apply text-[#999] text-[24rpx] font-medium flex items-center mr-[10rpx];
}
.product-widget .specs .spec-item .spec-value {
  @apply text-[#333] text-[24rpx] font-medium flex items-center;
}
.product-widget .actions {
  @apply flex items-center justify-end;
}
</style>
