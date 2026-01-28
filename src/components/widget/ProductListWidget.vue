<script setup lang="ts">
import type { ProductListWidgetData } from './types'

defineOptions({
  options: {
    styleIsolation: 'shared',
  },
})

const props = defineProps<{ data: ProductListWidgetData }>()
</script>

<template>
  <wd-card custom-class="product-list-widget">
    <view v-if="data.title || data.subtitle" class="product-title">
      <view class="title-text">
        {{ data.title }}
      </view>
      <view class="subtitle-text">
        {{ data.subtitle }}
      </view>
    </view>
    <view class="product-list">
      <view v-for="(product, index) in data.products" :key="index" class="product-item">
        <view v-if="product.thumbnail" class="product-item-image">
          <image :src="product.thumbnail" mode="scaleToFill"></image>
        </view>
        <view class="product-item-title">
          {{ product.name }}
        </view>
        <view class="product-item-price">
          ¥{{ product.price }}
        </view>
      </view>
    </view>
  </wd-card>
</template>

<style lang="scss">
.product-list-widget {
  @apply !mx-0 !bg-#f5f5f5 !py-3;

  .product-title {
    @apply mb-2;
    .title-text {
      @apply flex items-center  text-#333333 text-lg font-bold;
    }
    .subtitle-text {
      @apply text-#666666 text-sm;
    }
  }

  .product-list{
    @apply grid grid-cols-2 gap-4 ;

    .product-item{
      @apply  bg-gray-700/50 rounded-lg overflow-hidden;

      .product-item-image{
        @apply w-full h-160rpx;
        image{
          @apply w-full h-full;
        }
      }

      .product-item-title{
        @apply text-#fff text-26rpx font-bold px-2 mt-2;
      }

      .product-item-price{
        @apply text-#e4393c text-sm font-bold px-2 mb-2;
      }
    }
  }
}
</style>
