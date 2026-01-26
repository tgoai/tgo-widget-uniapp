<script setup lang="ts">
import type { OrderStatus, OrderWidgetData } from './types'
import { formatPrice } from './shared'

defineOptions({
  options: {
    styleIsolation: 'shared',
  },
})

const props = defineProps<{ data: OrderWidgetData }>()
</script>

<template>
  <wd-card type="rectangle" custom-class="order-widget">
    <template #title>
      <view class="title">
        <view class="title-text">
          订单号:{{ data.order_id }}
        </view>
        <view class="title-status">
          {{ data.status_text }}
        </view>
      </view>
    </template>
    <view>
      <!-- 商品 -->
      <view v-if="data.items.length > 0" class="goods">
        <view class="goods-list">
          <view v-for="(item, index) in data.items" :key="index" class="goods-item">
            <view class="goods-item-info">
              <view class="goods-item-content">
                <view v-if="item.image" class="goods-item-image">
                  <image :src="item.image.url" mode="aspectFill"></image>
                </view>
                <view class="goods-item-title">
                  {{ item.name }}
                </view>
              </view>
              <view v-if="item.attributes" class="goods-item-attributes">
                {{ Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(' | ') }}
              </view>
              <view v-if="item.sku" class="goods-item-attributes">
                SKU: {{ item.sku }}
              </view>
            </view>
            <view class="goods-item-price">
              <view>{{ item.quantity }}</view>
              <view>{{ formatPrice(item.total_price, data.currency || '¥') }}</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 金额信息 -->
      <view class="goods-price-info">
        <view class="goods-price-item">
          <view>商品小计</view>
          <view>{{ formatPrice(data.subtotal, data.currency || '¥') }}</view>
        </view>
        <view v-if="data.shipping_fee" class="goods-price-item">
          <view>运费</view>
          <view>{{ formatPrice(data.shipping_fee, data.currency || '¥') }}</view>
        </view>
        <view v-if="data.discount && data.discount > 0" class="goods-price-item">
          <view class="text-red-500">
            优惠
          </view>
          <view class="text-red-500">
            {{ formatPrice(data.discount, data.currency || '¥') }}
          </view>
        </view>
        <view class="goods-price-item">
          <view class="font-bold">
            合计
          </view>
          <view class="text-red-500">
            {{ formatPrice(data.total, data.currency || '¥') }}
          </view>
        </view>
      </view>

      <!-- 收货信息 -->
      <view v-if="data.shipping_address" class="goods-receiver-info">
        <view class="flex gap-2">
          <view>{{ data.receiver_name }}</view>
          <view>{{ data.receiver_phone }}</view>
        </view>
        <view>
          <view>{{ data.shipping_address }}</view>
        </view>
      </view>
      <!-- 物流信息 -->
      <view v-if="data.tracking_number" class="goods-logistics-info">
        <view class="flex gap-2">
          <view>{{ data.tracking_number }}</view>
          <view>{{ data.carrier }}</view>
        </view>
      </view>
    </view>

    <template v-if="data.actions && data.actions.length > 0" #footer>
      <view class="flex justify-end gap-2">
        <wd-button
          v-for="(action, index) in data.actions"
          :key="index"
          :type="action.style === 'primary' ? 'primary' : 'info'" size="small"
        >
          {{ action.label }}
        </wd-button>
      </view>
    </template>
  </wd-card>
</template>

<style lang="scss">
.order-widget {
  @apply !mx-0 !bg-#f5f5f5;

  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .title-status {
    display: none;
  }

  .goods {
    @apply flex flex-col gap-2;

    &-list {
      margin-bottom: 10rpx;
    }

    &-item {
      display: flex;
      justify-content: space-between;
      gap: 10rpx;
    }

    &-info{
      gap: 5rpx;
      @apply flex flex-col;
    }

    &-price-info {
      position: relative;
      padding: 12rpx 0;
      @apply flex flex-col;
      &::after {
        position: absolute;
        display: block;
        content: "";
        width: 100%;
        height: 1px;
        left: 0;
        top: 0;
        -webkit-transform: scaleY(.5);
        transform: scaleY(.5);
        background: var(--wot-card-content-border-color, rgba(0, 0, 0, .09));
      }
    }
    &-price-item {
      gap: 5rpx;
      @apply flex items-center justify-between;
    }

    &-receiver-info {
      @apply mt-2 p-3 bg-gray-700/50 rounded-lg text-sm text-#fff;
    }

    &-logistics-info {
      @apply mt-2;
    }
  }
}
</style>
